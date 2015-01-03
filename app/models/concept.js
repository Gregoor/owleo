var _ = require('lodash');
var Promise = require('promise');

var query = require('../db/connection.js').query;

function asArray(n) {
	return _.isArray(n) ? n: [n];
}

module.exports = {
	'find': function(id) {
		return query(
			'MATCH (c:Concept) WHERE id(c) = {id}' +
			'OPTIONAL MATCH (t:Tag)-[:TAGS]->(c)' +
			'RETURN ID(c) as id, c.name AS name, c.summary as summary, COLLECT(t.name) as tags',
			{'id': parseInt(id)}
		).then(function(dbData) {
				return dbData[0];
		});
	},
	'create': function(data) {
		return query(
			'MERGE (concept:Concept {name: {name}}) RETURN ID(concept) AS id', data
		).then(function(dbData) {
			return _.merge(dbData[0], data);
		});
	},
	'delete': function(id) {
		return query(
			'MATCH (c:Concept)' +
			'WHERE id(c) = {id}' +
			'OPTIONAL MATCH c-[r]-()' +
			'DELETE c, r',
			{'id': id}
		);
	},
	'all': function() {
		return query(
			'MATCH (n:Concept)' +
			'OPTIONAL MATCH (n)-[r:REQUIRES]->(req:Concept)' +
			'RETURN ID(n) AS id, n.name AS name, n.summary AS summary,' +
				'COLLECT(ID(req)) AS reqs'
		);
	},
	'addReqs': function(id, reqs) {
		return query(
			'MATCH (concept:Concept), (req:Concept)' +
			'WHERE ID(concept) = {id} AND ID(req) in {reqs}' +
			'CREATE UNIQUE (concept)-[:REQUIRES]->(req)',
			{'id': parseInt(id), 'reqs': asArray(reqs)}
		);
	},
	'deleteReqs': function(id, reqs) {
		return query(
			'MATCH (concept:Concept)-[r:REQUIRES]-(req:Concept)' +
			'WHERE ID(concept) = {id} AND ID(req) in {reqs}' +
			'DELETE r',
			{'id': parseInt(id), reqs: asArray(reqs)}
		);
	},
	'addTag': function(id, tagName) {
		return query(
			'MATCH (concept:Concept) WHERE ID(concept) = {id} ' +
			'MERGE (tag:Tag {name: {tagName}}) ' +
			'CREATE UNIQUE (tag)-[r:TAGS]->(concept)',
			{'id': id, 'tagName': tagName}
		);
	}
};