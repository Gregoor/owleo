import _ from 'lodash';

let {query} = require('./connection');

export default {
	search(params) {
		let query = `
			MATCH (t:Tag)-[:TAGS]->(:Concept)
		`;

		if (params.q.length > 0) {
			params.q = `(?i).*${params.q}.*`;
			query += `WHERE t.name =~ {q}`;
		}

		query += `
			RETURN DISTINCT t.name AS name
			LIMIT 10
		`;
		return {query, params};
	}
};