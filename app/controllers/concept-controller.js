let _ = require('lodash');
let Concept = require('../db/concept');

let conceptParams = (req) => {
	return _.pick(req.body.concept, 'name', 'summary', 'reqs', 'tags', 'links');
};

export default (router) => {
	router.route('/concepts')
		.get((req, res) => Concept.all().then(res.json.bind(res)))
		.post((req, res) => {
			Concept.create(conceptParams(req)).then(res.json.bind(res));
		});

	router.route('/concepts/position')
		.post((req, res) => {
			Concept.reposition(req.body.concepts).then(res.json.bind(res));
		});

	router.route('/concepts/:name')
		.get((req, res) => {
			Concept.find(req.params.name).then(res.json.bind(res));
		})
		.post((req, res) => {
			Concept.update(req.params.name, conceptParams(req)).then(res.json.bind(res));
		})
		.delete((req, res) => {
			Concept.delete(req.params.name);
			res.status(200).end();
		});
};