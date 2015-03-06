var _ = require('lodash');
var Promise = require('promise');

var query = require('../db/connection.js').query;

function asArray(n) {
	return _.isArray(n) ? n: [n];
}

var subQuery = {
	'createTags': 'FOREACH (tagName in {tags}| ' +
			'MERGE (newTag:Tag {name: tagName}) ' +
			'CREATE UNIQUE (newTag)-[:TAGS]->(c) ' +
		') ',
	'createLinks': 'FOREACH (link in {links}| ' +
		'MERGE (newLink:Link {url: link.url, paywalled: link.paywalled}) ' +
		'CREATE UNIQUE (newLink)-[:EXPLAINS]->(c) ' +
	') '
};

var Concept = module.exports = {
	'search': function(data) {
		if (data.tags.length == 0) return Concept.all();
		return query(
			'MATCH (t:Tag)-[:TAGS]->(n:Concept) ' +
			'WHERE t.name IN {tags} ' +
			'OPTIONAL MATCH (n)-[r:REQUIRES]->(req:Concept) ' +
			'RETURN ID(n) AS id, n.name AS name, n.summary AS summary,' +
				'COLLECT(ID(req)) AS reqs',
			data
		);
	},
	'find': function(id) {
		return query(
			'MATCH (c:Concept) WHERE ID(c) = {id} ' +
			'OPTIONAL MATCH (t:Tag)-[:TAGS]->(c) ' +
			'OPTIONAL MATCH (l:Link)-[:EXPLAINS]->(c) ' +
			'RETURN ID(c) as id, c.name AS name, c.summary as summary, ' +
			'COLLECT(DISTINCT t.name) as tags, COLLECT({url: l.url}) as links',
			{'id': parseInt(id)}
		).then(function(dbData) {
				return dbData[0];
		});
	},
	'create': function(data) {
		return query(
			'CREATE (c:Concept {data}) ' +
			subQuery.createTags +
			subQuery.createLinks +
			'RETURN ID(c) AS id',
			{
				'data': _.omit(data, 'tags', 'links'),
				'tags': data.tags,
				'links': data.links
			}
		).then(function(dbData) {
			return _.merge(dbData[0], data);
		});
	},
	'update': function(id, data) {
		return query(
			'MATCH (c:Concept) WHERE ID(c) = {id} ' +
			'OPTIONAL MATCH (oldTag:Tag)-[r1:TAGS]->(c) ' +
			'WHERE NOT(oldTag.name IN ({tags})) ' +
			'OPTIONAL MATCH (oldLink:Link)-[r2:EXPLAINS]->(c) ' +
			'WHERE NOT(oldLink.url IN ({links})) ' +
			'DELETE oldTag, oldLink, r1, r2 ' +
			subQuery.createTags +
			subQuery.createLinks +
			'SET c = {data} ' +
			'RETURN ID(c) AS id',
			{
				'id': parseInt(id),
				'data': _.omit(data, 'tags', 'links'),
				'tags': data.tags,
				'links': data.links
			}
		).then(function(dbData) {
				return _.merge(dbData[0], data);
			});
	},
	'delete': function(id) {
		return query(
			'MATCH (c:Concept) ' +
			'WHERE ID(c) = {id} ' +
			'OPTIONAL MATCH c-[r]-() ' +
			'DELETE c, r',
			{'id': parseInt(id)}
		);
	},
	'all': function() {
		return query(
			'MATCH (n:Concept) ' +
			'OPTIONAL MATCH (:Concept)-[r:REQUIRES*..]->(n) ' +
			'OPTIONAL MATCH (n)-[:REQUIRES]->(req:Concept) ' +
			'RETURN ID(n) AS id, n.name AS name, n.summary AS summary, ' +
				'COLLECT(DISTINCT ID(req)) AS reqs, COUNT(DISTINCT r) as edges'
		);
	},
	'addReqs': function(id, reqs) {
		return query(
			'MATCH (concept:Concept), (req:Concept) ' +
			'WHERE ID(concept) = {id} AND ID(req) in {reqs} ' +
			'CREATE UNIQUE (concept)-[:REQUIRES]->(req)',
			{'id': parseInt(id), 'reqs': asArray(reqs)}
		);
	},
	'deleteReqs': function(id, reqs) {
		return query(
			'MATCH (concept:Concept)-[r:REQUIRES]-(req:Concept) ' +
			'WHERE ID(concept) = {id} AND ID(req) in {reqs} ' +
			'DELETE r',
			{'id': parseInt(id), reqs: asArray(reqs)}
		);
	}
};