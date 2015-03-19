let _ = require('lodash');
let Promise = require('promise');

let query = require('../db/connection.js').query;

let asArray = (n) => _.isArray(n) ? n : [n];

let asParams = (concept) => ({
	'data': _.omit(concept, 'tags', 'links'),
	'reqs': concept.reqs || [],
	'tags': concept.tags || [],
	'links': concept.links || []
});

let subQuery = {
	connectNodes(reqs) {
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

let Concept = module.exports = {
	search(data) {
		if (data.tags.length == 0) return Concept.all();
		return query(
			`
				MATCH (t:Tag)-[:TAGS]->(n:Concept)
				WHERE t.name IN {tags}
				OPTIONAL MATCH (n)-[r:REQUIRES]->(req:Concept)
				RETURN ID(n) AS id, n.name AS name,
					n.summary AS summary,COLLECT(ID(req)) AS reqs
			`,
			data
		);
	},
	find(id) {
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
			{'id': parseInt(id), 'name': id}
		).then((dbData) => {
				let data = dbData[0];
				if (data.links[0].url == null) data.links = [];
				if (data.reqs[0].id == null) data.reqs = [];
				return data;
		});
	},
	create(data) {
		return query(
			`
				CREATE (c:Concept {data})
				${subQuery.connectConcepts}
				${subQuery.createTags}
				${subQuery.createLinks}
				RETURN ID(c) AS id
			`,
			asParams(data)
		).then((dbData) =>_.merge(dbData[0], data));
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

				${subQuery.connectNodes(params.reqs)}
				${subQuery.createTags}
				${subQuery.createLinks}
				SET c = {data}
				RETURN ID(c) AS id
			`,
			params
		).then((dbData) => _.merge(dbData[0], data));
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