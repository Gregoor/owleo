import _ from 'lodash';
import uuid from 'node-uuid';

import {db, query} from './connection';

const ERRORS = {
  CONTAINER_LOOP: Symbol()
};

let asParams = concept => ({
  'attrs': _.pick(concept, 'name', 'summary', 'summarySource'),
  'container': concept.container || '',
  'reqs': concept.reqs || [],
  'explanations': concept.explanations || []
});

let subCreates = {
  connectConcepts(reqs) {
    return _.isEmpty(reqs) ? '' : `
			WITH c
			OPTIONAL MATCH (newReq:Concept)
			WHERE newReq.id IN {reqs}
			CREATE UNIQUE (c)-[:REQUIRES]->(newReq)
		`
  },
  containConcept(container) {
    return container ? `
			WITH c
			OPTIONAL MATCH (newContainer:Concept {id: {container}})
			CREATE (c)-[:CONTAINED_BY]->(newContainer)
		` : '';
  }
};

let asAliases = (fields) => fields.map(([, alias]) => alias).join(',');
const FILTER_FIELDS = ['concepts', 'container', 'reqs', 'explanations'];
let filterEmptyAndOrder = concepts => {
  for (let concept of concepts) {
    for (let field of FILTER_FIELDS) {
      let val = concept[field];
      if (_.isArray(val)) {
        if (!val[0].id) concept[field] = [];
        else concept[field] = filterEmptyAndOrder(concept[field]);
      } else if (_.isObject(val)) {
        if (!val.id) concept[field] = null;
        else filterEmptyAndOrder([concept[field]]);
      }
    }
  }
  return _.sortBy(concepts, c => -c.conceptsCount);
};

class ConceptQuery {

  constructor(alias = 'c', parentFields = []) {
    this.params = {};
    this._alias = alias;
    this._queryParts = [];
    this._fields = [[alias, alias]];
    this._privateFields = [alias];
    this._parentFields = parentFields;
    if (_.isEmpty(parentFields)) {
      this._queryParts.push(`MATCH (${alias}:Concept)`);
    }
    this._limit = null;
  }

  idEquals(id) {
    this._limit = 1;
    this._addToQuery(`WHERE ${this._alias}.id = {id}`);
    this.params.id = id;
  }

  idIsIn(ids) {
    this._addToQuery(`WHERE ${this._alias}.id IN {ids}`);
    this.params.ids = ids;
  }

  hasPath(path) {
    let pathParts = path.split('/');

    this.params.name = pathParts.pop();
    this._addToQuery(`WHERE ${this._alias}.name = {name}`);

    if (pathParts.length) this._addToQuery(
      'MATCH ' + pathParts.map((n, i) => {
        let pathArg = 'path' + i;
        this.params[pathArg] = n;
        return `(:Concept {name: {${pathArg}}})`;
      }).concat(`(${this._alias})`).join('<-[:CONTAINED_BY]-')
    );
  }

  isContained(container) {
    this._addToQuery(container.length ?
      `MATCH (${this._alias})-[:CONTAINED_BY]->(:Concept {id: {container}})` :
      `WHERE NOT (${this._alias})-[:CONTAINED_BY]->()`
    );
    this.params.container = container;
  }

  matchesQuery(query, exclude = '') {
    this._addToQuery(
      (exclude ? `WHERE NOT(${this._alias}.id IN {exclude}) AND` : 'WHERE') +
      ` ${this._alias}.name =~ {query}`
    );
    this.params.query = `.*${query}.*`;
    if (exclude) this.params.exclude = exclude;
  }

  forUser(userId) {
    if (userId) {
      this._addToQuery(`OPTIONAL MATCH (:User {id: {userId}})-[self:VOTED]->(e)`,
        ['hasVoted', 'COUNT(DISTINCT self)']);
      this.params.userId = userId;
    } else {
      this._addToQuery('', ['hasVoted', '0']);
    }
  }

  withFields(fields: {}) {
    let {
      id, name, summary, summarySource, conceptsCount,
      container, concepts, reqs,  path, explanations
    } = fields;

    this._addToQuery('',
      ..._(['name', 'summary', 'summarySource'])
        .filter(f => fields[f])
        .map(f => [f, `${this._alias}.${f}`])
        .value()
    );

    if (conceptsCount) this._addToQuery(
      `OPTIONAL MATCH (${this._alias})<-[:CONTAINED_BY*]-(containees:Concept)`,
      ['conceptsCount', 'COUNT(DISTINCT containees)']
    );

    if (concepts) {
      let prefixed = this._prefix('concepts');
      this._addToQuery(
        `
        OPTIONAL MATCH (${prefixed}:Concept)-[:CONTAINED_BY]->(${this._alias})
        ${new ConceptQuery(prefixed, this._getAllFields())
          .withFields(concepts).getQueryString({multiple: true})}
      `,
        ['concepts', prefixed]
      );
    }

    if (container) {
      let prefixed = this._prefix('container');
      this._addToQuery(
        `
        OPTIONAL MATCH (${this._alias})-[:CONTAINED_BY]->(${prefixed}:Concept)
        ${new ConceptQuery(prefixed, this._getAllFields())
          .withFields(container).getQueryString()}
      `,
        ['container', prefixed]
      );
    }

    if (reqs) {
      let prefixed = this._prefix('reqs');
      this._addToQuery(
        `
        OPTIONAL MATCH (${this._alias})-[:REQUIRES]->(${prefixed}:Concept)
        ${new ConceptQuery(prefixed, this._getAllFields())
          .withFields(reqs).getQueryString({multiple: true})}
      `,
        ['reqs', prefixed]
      );
    }

    if (path) this._addToQuery(
      `OPTIONAL MATCH ${this._alias}-[:CONTAINED_BY*0..]->(containers:Concept)`,
      [
        'path',
        `COLLECT(DISTINCT {id: containers.id, name: containers.name})`
      ]
    );

    if (explanations) this._addToQuery(
      `
          OPTIONAL MATCH (explainer:User)-[:CREATED]->(e:Explanation)
            -[:EXPLAINS]->(${this._alias})
          OPTIONAL MATCH (u:User)-[v:VOTED]->(e)
          WITH ${asAliases(this._fields)},
            COUNT(u) AS votes, e, explainer
        `,
      ['explanations', `
          COLLECT({
            id: e.id, type: e.type, content: e.content, paywalled: e.paywalled,
            votes: votes, hasVoted: 0, createdAt: e.createdAt,
            author: {id: explainer.id, name: explainer.name}
          })
        `]
    );

    return this;
  }

  getQueryString({limit, multiple} = {}) {
    let {_alias: alias, _fields: fields, _parentFields: parentFields} = this;

    let returnFields = fields.filter(([alias]) => {
      return !_.includes(this._privateFields, alias);
    });

    let queryString = this._queryParts.join('\n');

    if (_.isEmpty(parentFields)) {

      return `${queryString}
        WITH ${asAliases(fields)}
        RETURN DISTINCT ${alias}.id AS id,
          ${returnFields.map(([label, alias]) => `${alias} AS ${label}`)}
        ${this._limit || limit ? 'LIMIT ' + (this._limit || limit) : ''}
      `;
    } else {
      let map = `
        {
          id: ${alias}.id,
          ${returnFields.map(([l, a]) => `${l}: ${a}`).join(', ')}
        }
      `;
      if (multiple) map = `COLLECT(${map})`;
      return `${queryString} WITH ${map} AS ${alias}, ${asAliases(parentFields)}`;
    }
  }

  _addToQuery(str, ...aliasSelections) {
    if (str) this._queryParts.push(str);

    let fields = this._fields.slice();
    let withString = aliasSelections.map(([alias, selection]) => {
      let tempAlias = this._prefix(alias);
      this._fields.push([alias, tempAlias]);
      return selection ? `${selection} AS ${tempAlias}` : tempAlias;
    }).join(', ');

    if (withString) this._addWithToQuery(withString, fields);
  }

  _addWithToQuery(withString, fields=this._fields) {
    this._queryParts.push(`
      WITH ${asAliases(fields)}, ${withString}
        ${this._parentFields.length ? ',' + asAliases(this._parentFields) : ''}
    `);
  }

  _prefix(alias) {
    return this._alias + _.capitalize(alias);
  }

  _getAllFields() {
    return [...this._parentFields, ...this._fields];
  }

}

export default {

  ERRORS,

  find(params = {}, fields = {}) {
    if (_.isEmpty(params)) return Promise.resolve([]);
    let conceptQuery = new ConceptQuery();

    if (params.path) conceptQuery.hasPath(params.path);

    if (params.id) conceptQuery.idEquals(params.id);
    else if (params.query) conceptQuery.matchesQuery(params.query, params.exclude);

    conceptQuery.forUser(params.userId);

    if (_.isString(params.container)) conceptQuery.isContained(params.container);

    conceptQuery.withFields(fields);

    let queryString = conceptQuery.getQueryString({limit: params.limit});

    return query(queryString, conceptQuery.params).then(filterEmptyAndOrder);
  },

  create(data, user="wat") {
    let params = asParams(data);
    params.attrs.id = uuid.v4();

    return query(
      `
				CREATE (c:Concept {attrs})

				${subCreates.containConcept(params.container)}
				${subCreates.connectConcepts(params.reqs)}

				RETURN c.id AS id
			`,
      params
    ).then(dbData => dbData[0].id);
  },

  update(id, data, user) {
    let params = _.extend(asParams(data), {id});
    let {container} = params;

    return query(
    `
      MATCH (c:Concept) WHERE c.id = {id}

      OPTIONAL MATCH (c)-[containerRel:CONTAINED_BY]
        ->(oldContainer:Concept)
      WHERE oldContainer.id IS NULL OR oldContainer.id <> {container}

      OPTIONAL MATCH (c)-[reqRel:REQUIRES]->(oldReq:Concept)
      WHERE NOT(oldReq.id IN {reqs})

      DELETE containerRel, reqRel

      ${subCreates.containConcept(container)}
      ${subCreates.connectConcepts(params.reqs)}
      SET c += {attrs}
    `,
      params
    ).then(() => id);
  },

  delete(id) {
    return query(
      `
				MATCH (c:Concept)
				WHERE c.id = {id}
				OPTIONAL MATCH c-[r]-()
				DELETE c, r
			`,
      {id}
    );
  }

};
