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
    this.params.query = `.*(?i)${query}.*`;
    if (exclude) this.params.exclude = exclude;
  }

  withFields(fields: {}, userId) {
    let {
      id, name, summary, summarySource, conceptsCount,
      container, concepts, reqs,  path, explanations, explanationsCount,
      followups
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

    if (followups) {
      let prefixed = this._prefix('followups');
      this._addToQuery(
        `
        OPTIONAL MATCH (${prefixed}:Concept)-[:CONTAINED_BY|:REQUIRES]->(${this._alias})
        ${new ConceptQuery(prefixed, this._getAllFields())
          .withFields(followups).getQueryString({multiple: true})}
        `,
        ['followups', prefixed]
      );
    }

    if (path) this._addToQuery(
      `OPTIONAL MATCH ${this._alias}-[:CONTAINED_BY*0..]->(containers:Concept)`,
      [
        'path',
        `COLLECT(DISTINCT {id: containers.id, name: containers.name})`
      ]
    );

    if (explanations) {
      this._addToQuery(
        `
          OPTIONAL MATCH (explainer:User)-[:CREATED]->(e:Explanation)
            -[:EXPLAINS]->(${this._alias})
          OPTIONAL MATCH (:User)-[upvotes:UPVOTED]->(e)
          OPTIONAL MATCH (:User)-[downvotes:DOWNVOTED]->(e)
          WITH ${asAliases(this._fields)},
            (COUNT(upvotes) - COUNT(downvotes)) AS votes, e, explainer


          ${!userId ? '' : `
            OPTIONAL MATCH (user:User {id: {userId}})
            OPTIONAL MATCH (user)-[upvote:UPVOTED]->(e)
            OPTIONAL MATCH (user)-[downvote:DOWNVOTED]->(e)

            WITH ${asAliases(this._fields)}, votes, e, explainer,
              COUNT(DISTINCT upvote) AS hasUpvoted,
              COUNT(DISTINCT downvote) AS hasDownvoted
          `}
        `,
        ['explanations', `
          COLLECT(DISTINCT {
            id: e.id, type: e.type, content: e.content, paywalled: e.paywalled,
            votes: votes,
            ${!userId ? '' : `hasUpvoted: hasUpvoted, hasDownvoted: hasDownvoted,`}
            createdAt: e.createdAt, author: {id: explainer.id, name: explainer.name}
          })
        `]
      );
      if (userId) this.params.userId = userId;
    }

    if (explanationsCount) this._addToQuery(
      `OPTIONAL MATCH (e:Explanation)-[:EXPLAINS]->(${this._alias})`,
      ['explanationsCount', 'COUNT(e)']
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
          ${[
            `id: ${alias}.id`, ...returnFields.map(([l, a]) => `${l}: ${a}`)
          ].join(', ')}
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

    if (params.id) conceptQuery.idEquals(params.id);
    else if (params.ids) conceptQuery.idIsIn(params.ids);
    else if (params.query) conceptQuery.matchesQuery(params.query, params.exclude);

    if (_.isString(params.container)) conceptQuery.isContained(params.container);

    conceptQuery.withFields(fields, params.userId);

    let queryString = conceptQuery.getQueryString({limit: params.limit});

    return query(queryString, conceptQuery.params).then(filterEmptyAndOrder);
  },

  create(data, user="wat") {
    let params = asParams(data);
    params.attrs.id = uuid.v4();

    if (params.container) params.reqs.push(params.container);

    return query(
      `
        MATCH (c1:Concept)-[:REQUIRES*]->(c2:Concept)
        WHERE c1.id IN {ids} AND c2.id IN {ids}
        RETURN DISTINCT c2.id AS id
      `,
      {ids: params.reqs}
    ).then(result => {
      const ids = result.map(({id}) => id);
      params.reqs = params.reqs.filter(id => !ids.includes(id));

      return query(
        `
				CREATE (c:Concept {attrs})

				${subCreates.containConcept(params.container)}
				${subCreates.connectConcepts(params.reqs)}

				RETURN c.id AS id
			`,
        params
      ).then(([{id}]) => id);
    });


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
