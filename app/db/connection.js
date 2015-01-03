var neo4j = require('neo4j');
var Promise = require('promise');

var connection = {
	'db': new neo4j.GraphDatabase(process.env.NEO4J_HOST || 'http://localhost:7474'),
	'query': function(query, params) {
		return new Promise(function(resolve) {
			connection.db.query(query, params, function(err, data) {
				if (err) console.error(err);
				else resolve(data);
			});
		})
	}
};

module.exports = connection;