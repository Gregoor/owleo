let _ = require('lodash');
let uuid = require('node-uuid');

let {db, query} = require('./connection');

let asParams = (concept) => ({
	'data': _.omit(concept, 'tags', 'links'),
	'reqs': concept.reqs || [],
	'tags': concept.tags || [],
	'links': concept.links || []
});

let subQuery = {
	connectConcepts(reqs) {
		if (_.isEmpty(reqs)) return '';
		return `
			WITH c
			OPTIONAL MATCH (newReq:Concept)
			WHERE newReq.name IN {reqs}
			CREATE UNIQUE (c)-[:REQUIRES]->(newReq)
		`
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
				OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)
				OPTIONAL MATCH (t:Tag)-[:TAGS]->(c)
				OPTIONAL MATCH (l:Link)-[:EXPLAINS]->(c)
				RETURN c.id AS id, c.name AS name, c.summary as summary,
					COLLECT(DISTINCT {id: req.id, name: req.name}) as reqs,
					COLLECT(DISTINCT t.name) as tags,
					COLLECT(DISTINCT {url: l.url, paywalled: l.paywalled}) as links
			`,
			{id}
		).then((dbData) => {
				let data = dbData[0];
				if (data.links[0].url == null) data.links = [];
				if (data.reqs[0].id == null) data.reqs = [];
				return data;
		});
	},

	create(data) {
		let params = asParams(_.extend({}, data, {'id': uuid.v4()}));
		return query(
			`
				CREATE (c:Concept {data})
				${subQuery.connectConcepts(params.reqs)}
				${subQuery.createTags}
				${subQuery.createLinks}
			`,
			params
		).then(() => this.find(data.name));
	},

	update(id, data) {
		let params = _.extend(asParams(data), {id});
		return query(
			`
				MATCH (c:Concept) WHERE c.id = {id}

				OPTIONAL MATCH (c)-[r1:REQUIRES]->(oldReq:Concept)
				WHERE NOT(oldReq.name IN {reqs})

				OPTIONAL MATCH (oldTag:Tag)-[r2:TAGS]->(c)
				WHERE NOT(oldTag.name IN {tags})

				OPTIONAL MATCH (oldLink:Link)-[r3:EXPLAINS]->(c)
				WHERE NOT(oldLink.url IN {links})

				DELETE r1, r2, r3

				${subQuery.connectConcepts(params.reqs)}
				${subQuery.createTags}
				${subQuery.createLinks}
				SET c = {data}
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
				OPTIONAL MATCH (:Concept)-[r:REQUIRES*..]->(c)
				OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)
				RETURN c.id AS id, c.name AS name, c.summary AS summary,
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