let _ = require('lodash');

let {query} = require('./connection');

export default {
	search(params) {
		let query = `MATCH (t:Tag)`;

		if (params.q.length > 0) {
			params.q = `.*${params.q}.*`;
			query += `WHERE t.name =~ {q}`;
		}

		query += `
			RETURN ID(t) AS id, t.name AS name
			LIMIT 10
		`;
		return {query, params};
	}
};