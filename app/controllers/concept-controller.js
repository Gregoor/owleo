let _ = require('lodash');
let Concept = require('../models/concept.js');

let conceptParams = (req) => {
	return _.pick(req.body.concept, 'name', 'summary', 'reqs', 'tags', 'links');
};

export default (router) => {
	router.route('/concepts')
		.get((req, res) => Concept.all().then(res.json.bind(res)))
		.post((req, res) => {
			Concept.create(conceptParams(req)).then(res.json.bind(res));
		});

	router.route('/concepts/search').get((req, res) => {
		Concept.search({'tags': _.compact(req.query.tags.split(','))})
			.then(res.json.bind(res));
	});

	router.route('/concepts/:id')
		.get((req, res) => {
			Concept.find(req.params.id).then(res.json.bind(res));
		})
		.post((req, res) => {
			Concept.update(req.params.id, conceptParams(req)).then(res.json.bind(res));
		})
		.delete((req, res) => {
			Concept.delete(req.params.id);
			res.status(200).end();
		});

	router.route('/concepts/:conceptId/reqs/:reqId')
		.post((req, res) => {
			let params = req.params;
			Concept.addReqs(params.conceptId, params.reqId);
			res.status(200).end();
		})
		.delete((req, res) => {
			let params = req.params;
			Concept.deleteReqs(params.conceptId, params.reqId);
			res.status(200).end();
		});
};