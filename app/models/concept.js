var neo4j = require('neo4j'),
	db = new neo4j.GraphDatabase('http://localhost:7474');

var Concept = function(nodeData, reqs) {
	this.attrs = nodeData._data.data;
	if (reqs && reqs.length > 0) this.attrs.reqs = reqs.map(function(req) {
		return new Concept(req).get('name');
	});
};

Concept.prototype = {
	get: function(name) {
		return this.attrs[name];
	}
};

Concept.create = function(concept, callback) {
	db.query('CREATE (concept:Concept {name: {name}}) RETURN concept', concept, function(err, data) {
		if (concept.reqs) {
			var query = 'MATCH (concept:Concept), (req:Concept)' +
				'WHERE concept.name = {name} AND req.name in {reqs}' +
				'CREATE (concept)-[:REQUIRES]->(req)';
			db.query(query, concept, function() {});
		}
		callback(err, data.map(function(nodeData) {
			return new Concept(nodeData.concept);
		}));
	});
};
Concept.all = function(callback) {
	var query = 'MATCH (n:Concept)' +
		'OPTIONAL MATCH (n)-[r:REQUIRES]->(req:Concept)' +
		'RETURN n, collect(req) AS reqs';
	db.query(query, function(err, data) {
		callback(err, data.map(function(nodeData) {
			return new Concept(nodeData.n, nodeData.reqs)
		}));
	});
};

module.exports = Concept;