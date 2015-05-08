import neo4j from 'neo4j';
import config from '../config.custom';

let connection = {
	'db': new neo4j.GraphDatabase({
		'url': config.dbHost || 'http://localhost:7474'
	}),
	'query': (query, params) => new Promise((resolve) => {
		connection.db.cypher({query, params, 'lean': true}, (err, data) => {
			if (err) console.error(err);
			else resolve(data);
		});
	})
};

export default connection;