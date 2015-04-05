let _ = require('lodash');
let uuid = require('node-uuid');

let {db, query} = require('./connection');

let asParams = (concept) => ({
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
	`,
	'createLinks': `
		FOREACH (link in {links}|
			MERGE (newLink:Link {url: link.url, paywalled: link.paywalled})
			CREATE UNIQUE (newLink)-[:EXPLAINS]->(c)
		)
	`
};

export default {

	search(params) {
		let query = `MATCH (c:Concept)`;

		if (params.q.length > 0) {
			params.q = `.*${params.q}.*`;
			query += `WHERE c.name =~ {q}`;
		}

		if (params.tags.length > 0) query += `
			MATCH (t:Tag)-[:TAGS]->(c)
			WHERE t.name IN {tags}
		`;

		query += `
			RETURN c.id AS id, c.name AS name, c.summary as summary
			LIMIT 10
		`;

		return {query, params};
	},

	find(id) {
		return query(
			`
				MATCH (c:Concept) WHERE c.id = {id}
				OPTIONAL MATCH (c)-[:CONTAINED_BY]->(container:Concept)
				OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)
				OPTIONAL MATCH (t:Tag)-[:TAGS]->(c)
				OPTIONAL MATCH (l:Link)-[:EXPLAINS]->(c)
				RETURN c.id AS id, c.name AS name, c.summary as summary,
					c.summarySource AS summarySource,
					{id: container.id, name: container.name} AS container,
					COLLECT(DISTINCT {id: req.id, name: req.name}) as reqs,
					COLLECT(DISTINCT t.name) as tags,
					COLLECT(DISTINCT {url: l.url, paywalled: l.paywalled}) as links
			`,
			{id}
		).then((dbData) => {
				let concept = dbData[0];
				if (concept.links[0].url == null) concept.links = [];
				if (concept.reqs[0].id == null) concept.reqs = [];

				if (concept.container.id == null) concept.container = {};

				return concept;
		});
	},

	create(data) {
		let params = asParams(data);
		params.data.id = uuid.v4();

		return query(
			`
				CREATE (c:Concept {data})

				${subQuery.containConcept(params.container)}
				${subQuery.connectConcepts(params.reqs)}
				${subQuery.createTags}
				${subQuery.createLinks}

				RETURN c.id AS id
			`,
			params
		).then((dbData) => this.find(dbData[0].id));
	},

	update(id, data) {
		let params = _.extend(asParams(data), {id});
		return query(
			`
				MATCH (c:Concept) WHERE c.id = {id}

				OPTIONAL MATCH (c)-[containerRel:CONTAINED_BY]-(oldContainer)
				WHERE oldContainer.id <> {container}

				OPTIONAL MATCH (c)-[reqRel:REQUIRES]->(oldReq:Concept)
				WHERE NOT(oldReq.id IN {reqs})

				OPTIONAL MATCH (oldTag:Tag)-[tagRel:TAGS]->(c)
				WHERE NOT(oldTag.name IN {tags})

				OPTIONAL MATCH (oldLink:Link)-[explainsRel:EXPLAINS]->(c)
				WHERE NOT(oldLink.url IN {links})

				DELETE containerRel, reqRel, tagRel, explainsRel

				${subQuery.containConcept(params.container)}
				${subQuery.connectConcepts(params.reqs)}
				${subQuery.createTags}
				${subQuery.createLinks}
				SET c += {data}
			`,
			params
		).then(() => this.find(id));
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
				MATCH (c:Concept) WHERE c.name IS NOT NULL
				OPTIONAL MATCH (c)-[:CONTAINED_BY]->(container:Concept)
				OPTIONAL MATCH (:Concept)-[r:REQUIRES*..]->(c)
				OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)
				RETURN c.id AS id, c.name AS name, c.summary AS summary,
					container.id AS container,
					c.x AS x, c.y AS y,
					COLLECT(DISTINCT req.id) AS reqs, COUNT(DISTINCT r) as edges
			`
		);
	},

	reposition(concepts) {
		return new Promise((resolve) => {
			db.cypher(concepts.map((concept) => {
				return {
					'query': `
					MATCH (c:Concept)
					WHERE c.id = {id}
					SET c += {pos}
				`,
					'params': _.extend(
						_.pick(concept, 'id'),
						{'pos': _.pick(concept.pos, 'x', 'y')}
					)
				};
			}), () => this.all().then(resolve));
		});
	}

};