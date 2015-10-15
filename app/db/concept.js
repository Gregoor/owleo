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

let subQuery = {
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

export default {

  ERRORS,

  find(args, limit = null) {
    let queryStr = 'MATCH (c:Concept) ';
    let globalWith = 'c';
    let extendWith = (expr, alias) => {
      let entry = alias ? `${expr} AS ${alias}` : alias;
      let withStr = `WITH ${entry}, ${globalWith}  `;
      globalWith += ', ' + alias || expr;
      return withStr;
    };

    if (args.path) {
      let pathParts = args.path.split('/');

      args.name = pathParts.pop();
      queryStr += 'WHERE c.name = {name} ';

      if (pathParts.length) queryStr += 'MATCH ' + (pathParts.map((n, i) => {
        let pathArg = 'path'+i;
        args[pathArg] = n;
        return `(:Concept {name: {${pathArg}}})`;
      }).concat('(c)').join('<-[:CONTAINED_BY]-'));
    }

    if (args.id) {
      limit = 1;
      queryStr += 'WHERE c.id = {id} ';
    } else if (args.query) {
      if (args.exclude) queryStr += 'WHERE NOT(c.id IN {exclude}) AND ';
      else queryStr += 'WHERE ';
      args.query = `.*${args.query}.*`;
      queryStr += 'c.name =~ {query} ';
    }

    if (args.userId) {
      queryStr += `
        OPTIONAL MATCH (:User {id: {userId}})-[self:VOTED]->(e)
        ${extendWith('COUNT(DISTINCT self)', 'hasVoted')}
      `;
    } else {
      queryStr += extendWith('0', 'hasVoted');
    }

    if (_.isString(args.container)) {
      if (args.container.length) {
        queryStr += 'MATCH (c)-[:CONTAINED_BY]->(:Concept {id: {container}})';
      } else {
        queryStr += 'WHERE NOT (c)-[:CONTAINED_BY]->()';
      }
    }

    queryStr += `
      OPTIONAL MATCH (c)-[:CONTAINED_BY]->(container:Concept)
      ${extendWith('{id: container.id, name: container.name}', 'container')}

      OPTIONAL MATCH (c)<-[:CONTAINED_BY]-(containees:Concept)
      ${extendWith('COUNT(DISTINCT containees)', 'conceptsCount')}

      OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)
      ${extendWith('COLLECT(DISTINCT req.id)', 'reqs')}

      OPTIONAL MATCH (explainer:User)-[:CREATED]->(e:Explanation)
        -[:EXPLAINS]->(c)
      OPTIONAL MATCH (u:User)-[v:VOTED]->(e)
      WITH COUNT(u) AS votes, e, explainer, ${globalWith}
      ${extendWith(`COLLECT(
        {
          id: e.id, content: e.content, paywalled: e.paywalled, votes: votes,
          hasVoted: 0, createdAt: e.createdAt,
          author: {id: explainer.id, name: explainer.name}
        }
      )`, 'explanations')}

      OPTIONAL MATCH (c)-[:CONTAINED_BY*0..]->(containers:Concept)
      ${extendWith('COLLECT(DISTINCT containers.name)', 'path')}

      RETURN c.id AS id, c.name AS name, c.summary AS summary,
        c.summarySource AS summarySource, c.color AS color, path, reqs,
        container, conceptsCount, explanations
      ORDER BY conceptsCount DESC
    `;

    if (limit || args.limit) queryStr += 'LIMIT ' + (limit || args.limit);

    return query(queryStr, args).then(dbData => {
      let concepts = dbData.map(concept => {
        if (!concept) return;
        if (concept.explanations[0].id == null) concept.explanations = [];
        if (concept.container.id == null) concept.container = null;

        return concept;
      });
      return limit == 1 ? concepts[0] : concepts;
    });
  },

  create(data, user="wat") {
    let params = asParams(data);
    params.attrs.id = uuid.v4();

    return query(
      `
				CREATE (c:Concept {attrs})

				${subQuery.containConcept(params.container)}
				${subQuery.connectConcepts(params.reqs)}

				RETURN c.id AS id
			`,
      params
    ).then(dbData => this.find({id: dbData[0].id}));
  },

  update(user, id, data) {
    let params = _.extend(asParams(data), {id});
    let {container} = params;

    let promise = container ?
      this.isContainedBy(container, id) :
      Promise.resolve(false);

    return promise.then(isContained => {
      if (isContained) throw ERRORS.CONTAINER_LOOP;

      return query(
        `
				MATCH (c:Concept) WHERE c.id = {id}

				OPTIONAL MATCH (c)-[containerRel:CONTAINED_BY]
          ->(oldContainer:Concept)
				WHERE oldContainer.id IS NULL OR oldContainer.id <> {container}

				OPTIONAL MATCH (c)-[reqRel:REQUIRES]->(oldReq:Concept)
				WHERE NOT(oldReq.id IN {reqs})

				DELETE containerRel, reqRel

				${subQuery.containConcept(container)}
				${subQuery.connectConcepts(params.reqs)}
				SET c += {data}
			`,
        params
      ).then(() => this.find(user, id));
    });
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
  },

  reposition(concepts) {
    return new Promise(resolve => {
      db.cypher(concepts.map((concept) => {
        return {
          'query': `
					MATCH (c:Concept)
					WHERE c.id = {id}
					SET c += {pos}
				`,
          'params': _.extend(
            _.pick(concept, 'id'),
            {'pos': _.pick(concept, 'x', 'y', 'r')}
          )
        };
      }), () => this.all().then(resolve));
    });
  }

};
