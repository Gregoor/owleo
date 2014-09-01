var neo4j = require('neo4j'),
	db = new neo4j.GraphDatabase('http://localhost:7474'),

	merge = require('merge'),
	handleErr = function(callback) {
		return function(err, data) {
			if (err) console.error(err);
			else if (callback) callback(data);
		}
	},
	neo2attr = function(neoData) {
		return neoData._data.data;
	};

var Concept = function(attrs) {
	if (!(this instanceof Concept)) throw 'Missing new keyword';
	this.attrs = attrs;

	var id = this.get('id');
	if (id !== undefined) {
		this.set('id', parseInt(id));
	}
};

Concept.prototype = {
	'get': function(name) {
		return this.attrs[name];
	},
	'set': function(name, value) {
		this.attrs[name] = value;
	},
	'isNew': function() {
		return this.get('id') === undefined;
	},
	'addReqs': function(reqs, callback) {
		var query = 'MATCH (concept:Concept), (req:Concept)' +
			'WHERE id(concept) = {id} AND id(req) in {reqs}' +
			'CREATE (concept)-[:REQUIRES]->(req)',
			params = {
				id: this.get('id'),
				reqs: typeof reqs == 'object' ? reqs : [reqs]
			};
		db.query(query, params, handleErr(function(data) {
			if (callback) callback();
		}));
	},
	'deleteReqs': function(reqs, callback) {
		var query = 'MATCH (concept:Concept)-[r:REQUIRES]-(req:Concept)' +
				'WHERE id(concept) = {id} AND id(req) in {reqs}' +
				'DELETE r',
			params = {
				id: this.get('id'),
				reqs: typeof reqs == 'object' ? reqs : [reqs]
			};
		db.query(query, params, handleErr(function(data) {
			if (callback) callback();
		}));
	},
	'delete': function(callback) {
		var query = 'MATCH (n:Concept)' +
			'WHERE id(n) = {id}' +
			'OPTIONAL MATCH n-[r]-()' +
			'DELETE n, r';

		db.query(query, {'id': this.get('id')}, handleErr(callback))
	}
};
Concept.create = function(conceptData, callback) {
	db.query('CREATE (concept:Concept {name: {name}}) RETURN id(concept) AS id', conceptData, handleErr(function(data) {
		var concept = new Concept(merge(conceptData, {id: data[0].id}));
		if (conceptData.reqs) concept.addReqs(conceptData.reqs);
		callback(concept);
	}));
};
Concept.all = function(callback) {
	var query = 'MATCH (n:Concept)' +
		'OPTIONAL MATCH (n)-[r:REQUIRES]->(req:Concept)' +
		'RETURN n, id(n) AS id, collect(id(req)) AS reqs';
	db.query(query, handleErr(function(data) {
		callback(data.map(function(nodeData) {
			return new Concept(merge(neo2attr(nodeData.n), {id: nodeData['id'], reqs: nodeData.reqs}));
		}));
	}));
};

module.exports = Concept;