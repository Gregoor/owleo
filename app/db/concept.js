import _ from 'lodash';
import uuid from 'node-uuid';

import {db, query} from './connection';

let asParams = concept => ({
	'data': _.omit(concept, 'id', 'container', 'reqs', 'tags', 'links'),
	'container': concept.container || '',
	'reqs': concept.reqs || [],
	'tags': concept.tags || [],
	'links': concept.links || []
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
				OPTIONAL MATCH (l:Link)-[:EXPLAINS]->(c)
				OPTIONAL MATCH (u:User)-[v:VOTED]->(l)
				OPTIONAL MATCH (:User {id: {userId}})-[self:VOTED]->(l)

				WITH c, container, t, l, req, reqContainer,
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
						id: l.id,
						name: l.name,
						url: l.url,
						paywalled: l.paywalled,
						votes: votes,
						hasVoted: hasVoted
					}) as links
			`,
			{id, 'userId': user ? user.id : null}
		).then(dbData => {
				let concept = dbData[0];

				if (!concept) return;
				if (concept.reqs[0].id == null) concept.reqs = [];
				if (concept.links[0].url == null) concept.links = [];
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
		return query(
			`
				MATCH (c:Concept) WHERE c.id = {id}

				OPTIONAL MATCH (c)-[containerRel:CONTAINED_BY]->(oldContainer:Concept)
				WHERE oldContainer.id IS NULL OR oldContainer.id <> {container}

				OPTIONAL MATCH (c)-[reqRel:REQUIRES]->(oldReq:Concept)
				WHERE NOT(oldReq.id IN {reqs})

				OPTIONAL MATCH (oldTag:Tag)-[tagRel:TAGS]->(c)
				WHERE NOT(oldTag.name IN {tags})

				DELETE containerRel, reqRel, tagRel

				${subQuery.containConcept(params.container)}
				${subQuery.connectConcepts(params.reqs)}
				${subQuery.createTags}
				SET c += {data}
			`,
			params
		).then(() => this.find(user, id));
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
				OPTIONAL MATCH (c)-[:CONTAINED_BY]->(container:Concept)
				OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)

				RETURN c.id AS id, c.name AS name, c.x AS x, c.y AS y,
					c.r AS r, c.color AS color, container.id AS container,
					COLLECT(DISTINCT req.id) AS reqs
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
	}

};