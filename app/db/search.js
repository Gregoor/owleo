let _ = require('lodash');

let {db} = require('./connection');
let Concept = require('./concept');
let Tag = require('./tag');

export default (params) => {
	params = _.defaults(params, {
		'for': ['Concept', 'Tag'],
		'q': '',
		'tags': []
	});

	let queries = [];
	for (let node of params.for) {
		let p = _.cloneDeep(params);
		queries.push(node == 'Concept' ? Concept.search(p) : Tag.search(p));
	}

	return new Promise((resolve) => db.cypher(queries, (err, results) => {
		resolve(results.reduce((all, result, i) => {
			let type = params.for[i];
			result.forEach((n) => n.type = type)
			return all.concat(result);
		}, []));
	}));
}