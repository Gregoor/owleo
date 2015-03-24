let _ = require('lodash');

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
			WHERE ID(newReq) IN {reqs}
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
			RETURN ID(c) AS id, c.name AS name, c.summary as summary
			LIMIT 10
		`;
		return {query, params};
	},
	find(id) {
		let name = id;
		id = parseInt(id);
		if (isNaN(id)) id = -1;
		else name = null;
		return query(
			`
				MATCH (c:Concept) WHERE ID(c) = {id} OR c.name = {name}
				OPTIONAL MATCH (c)-[:REQUIRES]->(req:Concept)
				OPTIONAL MATCH (t:Tag)-[:TAGS]->(c)
				OPTIONAL MATCH (l:Link)-[:EXPLAINS]->(c)
				RETURN ID(c) as id, c.name AS name, c.summary as summary,
					COLLECT(DISTINCT {id: ID(req), name: req.name}) as reqs,
					COLLECT(DISTINCT t.name) as tags,
					COLLECT({url: l.url, paywalled: l.paywalled}) as links
			`,
			{id, name}
		).then((dbData) => {
				let data = dbData[0];
				if (data.links[0].url == null) data.links = [];
				if (data.reqs[0].id == null) data.reqs = [];
				return data;
		});
	},
	create(data) {
		let params = asParams(data);
		return query(
			`
				CREATE (c:Concept {data})
				${subQuery.connectConcepts(params.reqs)}
				${subQuery.createTags}
				${subQuery.createLinks}
				RETURN ID(c) AS id
			`,
			params
		).then((dbData) => this.find(dbData[0].id));
	},
	update(id, data) {
		let params = _.extend(asParams(data), {'id': parseInt(id)});
		return query(
			`
				MATCH (c:Concept) WHERE ID(c) = {id}

				OPTIONAL MATCH (c)-[r1:REQUIRES]->(oldReq:Concept)
				WHERE NOT(ID(oldReq) IN {reqs})

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
				WHERE ID(c) = {id}
				OPTIONAL MATCH c-[r]-()
				DELETE c, r
			`,
			{'id': parseInt(id)}
		);
	},
	all() {
		return query(
			`
				MATCH (n:Concept)
				OPTIONAL MATCH (:Concept)-[r:REQUIRES*..]->(n)
				OPTIONAL MATCH (n)-[:REQUIRES]->(req:Concept)
				RETURN ID(n) AS id, n.name AS name, n.summary AS summary,
					COLLECT(DISTINCT ID(req)) AS reqs, COUNT(DISTINCT r) as edges
			`
		);
	}
};