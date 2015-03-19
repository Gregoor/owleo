let neo4j = require('neo4j');

let connection = {
	'db': new neo4j.GraphDatabase({
		'url': process.env.NEO4J_HOST || 'http://localhost:7474'
	}),
	'query': (query, params) => new Promise((resolve) => {
		connection.db.cypher({query, params, 'lean': true}, (err, data) => {
			if (err) console.error(err);
			else resolve(data);
		});
	})
};

export default connection;