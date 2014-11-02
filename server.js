var _ = require('lodash'),
	express = require('express'),
	app = express(),
	router = express.Router(),

	basicAuth = require('basic-auth-connect'),
	bodyParser = require('body-parser'),

	port = process.env.PORT || 8080,

	basicAuthPw = process.env.SKILLGRAPH_PW,

	Concept = require('./app/models/concept.js');

if (basicAuthPw) app.use(basicAuth('wurzel', basicAuthPw));
app.use(function(req, res, next) {
	// TODO: Check for prod
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');

	next();
});
app.use(express.static('client/dist'));
app.use(bodyParser.json());

router.route('/concepts')
	.get(function(req, res) {
		Concept.all().then(function(concepts) {
			res.json(concepts.map(function(concept) {
				return concept.attrs;
			}));
		});
	})
	.post(function(req, res) {
		Concept.create(req.body.concept).then(function(concept) {
			res.json(concept.attrs);
		});
	});

router.route('/concepts/:id')
	.get(function(req, res) {
		Concept.find(req.params.id).then(function(concept) {
			res.json(concept.attrs);
		});
	})
	.post(function(req, res) {
		var concept = new Concept({id: req.params.id});
		concept.addReqs().then(req.body.reqs, function() {
			res.json(concept);
		});
	})
	.delete(function(req, res) {
		var concept = new Concept({id: req.params.id});
		concept.delete().then(function() {
			res.status(200).end();
		});
	});

router.route('/concepts/:conceptId/reqs/:reqId')
	.post(function(req, res) {
		var params = req.params,
			concept = new Concept({id: params.conceptId});

		concept.addReqs(params.reqId);
		res.status(200).end();
	})
	.delete(function(req, res) {
		var params = req.params,
			concept = new Concept({id: params.conceptId});
		concept.deleteReqs(params.reqId);
		res.status(200).end();
	});

router.route('/concepts/:conceptId/materials')
	.post(function(req, res) {
		var params = req.params,
			concept = new Concept({id: params.conceptId});

 		concept.addMaterial(_.pick(req.body.material, 'content'))
		  .then(function(data) {
				res.json(data);
			});

	});

router.route('/concepts/:conceptId/materials/:materialId')
	.post(function(req, res) {
		var params = req.params,
			concept = new Concept({id: params.conceptId});

		concept.updateMaterial(params.materialId, req.body.material).then(function(data) {
			res.json(data);
		});
	})
	.delete(function(req, res) {
		var params = req.params,
			concept = new Concept({id: params.conceptId});
		res.status(200).end();
	});

app.use('/api', router);

app.listen(port);
console.log('HTTP running on http://localhost:' + port);