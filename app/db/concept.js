import _ from 'lodash';
import uuid from 'node-uuid';

import {db, query} from './connection';

const ERRORS = {
  CONTAINER_LOOP: Symbol()
};

let asParams = concept => ({
  'data': _.omit(concept, 'id', 'container', 'reqs', 'tags', 'explanations'),
  'container': concept.container || '',
  'reqs': concept.reqs || [],
  'tags': concept.tags || [],
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
  },
  'createTags': `
		FOREACH (tagName in {tags}|
			MERGE (newTag:Tag {name: tagName})
			CREATE UNIQUE (newTag)-[:TAGS]->(c)
		)
	`
};

export default {

  ERRORS,

  search(params) {
    let query = `
			MATCH (c:Concept)
		`;

    if (params.q.length > 0) {
      params.q = `(?i).*${params.q}.*`;
      query += `WHERE c.name =~ {q}`;
    }

    if (params.tags.length > 0) query += `
			MATCH (t:Tag)-[:TAGS]->(c)
			WHERE t.name IN {tags}
		`;

    if (params.reqBy) query += `
      MATCH (c)-[:REQUIRES]->(req:Concept)
      WHERE req.id = {reqBy} OR req.name = {reqBy}
    `;

    if (params.leadsTo) query += `
      MATCH (followup:Concept)-[:REQUIRES]->(c)
      WHERE followup.id = {leadsTo} OR followup.name = {leadsTo}
    `;

    query += `
			OPTIONAL MATCH (c)-[:CONTAINED_BY]->(container:Concept)
			RETURN DISTINCT c.id AS id, c.name AS name,
				{id: container.id, name: container.name} AS container
			LIMIT 10
		`;

    return {query, params};
  },

  find(user, id) {
    return query(
      `
        MATCH (c:Concept) WHERE c.id = {id}

        OPTIONAL MATCH (c)-[:CONTAINED_BY]->(container:Concept)

        OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)
        OPTIONAL MATCH (req)-[:CONTAINED_BY]->(reqContainer:Concept)
        OPTIONAL MATCH (followup:Concept)-[:REQUIRES]->(c)

        OPTIONAL MATCH (t:Tag)-[:TAGS]->(c)
        OPTIONAL MATCH (explainer:User)-[:CREATED]->
          (e:Explanation)-[:EXPLAINS]->(c)
        OPTIONAL MATCH (u:User)-[v:VOTED]->(e)
        OPTIONAL MATCH (:User {id: {userId}})-[self:VOTED]->(e)

        WITH c, container, t, e, req, reqContainer, explainer,
          COUNT(DISTINCT u) AS votes,
          COUNT(DISTINCT self) AS hasVoted,
          COUNT(DISTINCT followup) AS followupCount,
          COUNT(DISTINCT req) AS reqCount

        RETURN c.id AS id, c.name AS name, c.summary as summary,
          c.summarySource AS summarySource, c.color AS color,
          {id: container.id, name: container.name} AS container,
          followupCount,
          COLLECT(DISTINCT {id: req.id, name: req.name,
            container: {
              id: reqContainer.id, name: reqContainer.name
            }
          }) as reqs,
          COLLECT(DISTINCT t.name) as tags,
          COLLECT(DISTINCT {
            id: e.id,
            content: e.content,
            paywalled: e.paywalled,
            votes: votes,
            hasVoted: hasVoted,
            createdAt: e.createdAt,
            author: {id: explainer.id, name: explainer.name}
          }) as explanations
			`,
      {id, 'userId': user ? user.id : null}
    ).then(dbData => {
        let concept = dbData[0];

        if (!concept) return;
        if (concept.reqs[0].id == null) concept.reqs = [];
        if (concept.explanations[0].id == null) concept.explanations = [];
        if (concept.container.id == null) concept.container = {};

        return concept;
      });
  },

  create(user, data) {
    let params = asParams(data);
    params.data.id = uuid.v4();

    return query(
      `
				CREATE (c:Concept {data})

				${subQuery.containConcept(params.container)}
				${subQuery.connectConcepts(params.reqs)}
				${subQuery.createTags}

				RETURN c.id AS id
			`,
      params
    ).then(dbData => this.find(user, dbData[0].id));
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

				OPTIONAL MATCH (oldTag:Tag)-[tagRel:TAGS]->(c)
				WHERE NOT(oldTag.name IN {tags})

				DELETE containerRel, reqRel, tagRel

				${subQuery.containConcept(container)}
				${subQuery.connectConcepts(params.reqs)}
				${subQuery.createTags}
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

  all() {
    return query(
      `
				MATCH (c:Concept)
				OPTIONAL MATCH (c)-[:REQUIRES*0..]->(reqs:Concept)
				OPTIONAL MATCH (c)<-[:CONTAINED_BY*0..]-(containees:Concept)
				OPTIONAL MATCH (c)-[:CONTAINED_BY]->(container:Concept)
				OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)

				RETURN c.id AS id, c.name AS name, c.x AS x, c.y AS y,
					c.r AS r, c.color AS color, container.id AS container,
					COLLECT(DISTINCT req.id) AS reqs,
					COUNT(DISTINCT reqs) AS reqCount,
					COUNT(DISTINCT containees) AS containeeCount
			`
    ).then(concepts => concepts.map(concept => [concept.id, concept]));
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
  },

  isContainedBy(id1, id2) {
    if (id1 == id2) return Promise.resolve(true);
    return query(
      `
        MATCH (c1:Concept {id: {id1}})
        MATCH (c2:Concept {id: {id2}})
        MATCH p=(c1)-[:CONTAINED_BY*]->(c2)
        RETURN COUNT(RELATIONSHIPS(p)) > 0 AS isContained
      `,
      {id1, id2}
    ).then(r => r[0].isContained);
  }

};
