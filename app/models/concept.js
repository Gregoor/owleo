var neo4j = require('neo4j'),
	db = new neo4j.GraphDatabase(process.env.NEO4J_HOST || 'http://localhost:7474'),
	_ = require('lodash'),
	Promise = require('promise'),

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
	'addReqs': function(reqs) {
		var query = 'MATCH (concept:Concept), (req:Concept)' +
					'WHERE ID(concept) = {id} AND ID(req) in {reqs}' +
					'CREATE (concept)-[:REQUIRES]->(req)',
			params = {
				id: this.get('id'),
				reqs: typeof reqs == 'object' ? reqs : [reqs]
			};

		return new Promise(function(resolve) {
			db.query(query, params, handleErr(resolve));
		});

	},
	'deleteReqs': function(reqs) {
		var query = 'MATCH (concept:Concept)-[r:REQUIRES]-(req:Concept)' +
					'WHERE ID(concept) = {id} AND ID(req) in {reqs}' +
					'DELETE r',
			params = {
				id: this.get('id'),
				reqs: typeof reqs == 'object' ? reqs : [reqs]
			};
		return new Promise(function(resolve) {
			db.query(query, params, handleErr(resolve));
		});
	},
	'delete': function() {
		var self = this,
				query = 'MATCH (n:Concept)' +
					'WHERE id(n) = {id}' +
					'OPTIONAL MATCH n-[r]-()' +
					'DELETE n, r';

		return new Promise(function(resolve) {
			db.query(query, {'id': self.get('id')}, handleErr(resolve));
		});

	},
	'addMaterial': function(data) {
		var concept = this,
				query = 'MATCH (concept:Concept) WHERE id(concept) = {id} ' +
					'CREATE ' +
						'(material:Material {data})' +
						'-[:EXPLAINS]' +
						'->(concept) ' +
					'RETURN material, ID(material) AS id';

		return new Promise(function(resolve) {
			db.query(query, {id: concept.get('id'), data: data}, handleErr(function(dbData) {
				resolve({material: _.merge(
					{id: dbData[0].id},
					neo2attr(dbData[0].material)
				)});
			}));
		});
	},
	'updateMaterial': function(id, data) {
		var query = 'MATCH (material:Material) WHERE ID(material) = {id}' +
					'SET material += {data}' +
					'RETURN material, ID(material) AS id';

		return new Promise(function(resolve) {
			db.query(query, {
				id: parseInt(id),
				data: _.omit(data, 'id')
			}, handleErr(function(dbData) {
				resolve({material: _.merge(
					{id: dbData[0].id},
					neo2attr(dbData[0].material)
				)});
			}));
		});
	}
};
Concept.find = function(id) {
	var attrs = {id: id};

	return new Promise(function(resolve) {
		db.query(
			'MATCH (concept:Concept) WHERE id(concept) = {id}' +
				'OPTIONAL MATCH (material:Material)-[:EXPLAINS]->(concept)' +
				'RETURN concept, COLLECT(ID(material)) AS materialId, COLLECT(material) AS materials',
			{id: parseInt(id)},
			handleErr(function(dbData) {
					var concept, materials = [], dbMaterials = dbData[0].materials;

					for (var i = 0; i < dbMaterials.length; i++) {
						materials[i] = _.merge(
							{id: dbData[0].materialId[i]},
							neo2attr(dbMaterials[i])
						);
					}
					concept = new Concept(_.merge(attrs, neo2attr(dbData[0].concept), {
						materials: materials
					}));

					resolve(concept);
				}
			));
	});
};
Concept.create = function(data) {
	return new Promise(function(resolve) {
		db.query(
			'CREATE (concept:Concept {name: {name}}) RETURN ID(concept) AS id',
			data,
			handleErr(function(dbData) {
				var concept = new Concept(_.merge(data, {id: dbData[0].id}));

				if (data.reqs) concept.addReqs(data.reqs);
				resolve(concept);
			})
		);
	});
};
Concept.all = function() {
	var query = 'MATCH (n:Concept)' +
				'OPTIONAL MATCH (n)-[r:REQUIRES]->(req:Concept)' +
				'RETURN n, ID(n) AS id, COLLECT(ID(req)) AS reqs';
	return new Promise(function(resolve) {
		db.query(query, handleErr(function(data) {
			resolve(data.map(function(dbData) {
				return new Concept(
					_.merge(
						neo2attr(dbData.n),
						{id: dbData['id'], reqs: dbData.reqs}
					)
				);
			}));
		}));
	});
};

module.exports = Concept;