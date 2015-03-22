let _ = require('lodash');

let search = require('../db/search');

export default (router) => {
	router.route('/search').get((req, res) => {
		search(JSON.parse(req.query.json)).then(res.json.bind(res));
	});
};