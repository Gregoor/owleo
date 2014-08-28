var neo4j = require('neo4j'),
	db = new neo4j.GraphDatabase('http://localhost:7474');

var Concept = function(nodeData) {
	this.attrs = nodeData._data.data;
};

Concept.prototype = {
};

Concept.create = function(name, callback) {
	db.query('CREATE (concept:Concept {name: {aName}}) RETURN concept', {'aName': name}, function(err, data) {
		callback(err, data.map(function(nodeData) {
			return new Concept(nodeData.concept)
		}));
	});
};
Concept.all = function(callback) {
	db.query('MATCH (n:Concept) RETURN n;', function(err, data) {
		callback(err, data.map(function(nodeData) {
			return new Concept(nodeData.n)
		}));
	});
};

module.exports = Concept;