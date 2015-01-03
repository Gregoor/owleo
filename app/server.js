var _ = require('lodash'),
	express = require('express'),
	app = express(),
	router = express.Router(),

	basicAuth = require('basic-auth-connect'),
	bodyParser = require('body-parser'),

	port = process.env.PORT || 8080,

	basicAuthPw = process.env.SKILLGRAPH_PW,

	Concept = require('./models/concept.js'),
	Tag = require('./models/tag.js');

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
			res.json(concepts);
		});
	})
	.post(function(req, res) {
		Concept.create(req.body.concept).then(function(concept) {
			res.json(concept);
		});
	});

router.route('/concepts/:id')
	.get(function(req, res) {
		Concept.find(req.params.id).then(function(concept) {
			res.json(concept);
		});
	})
	.post(function(req, res) {
	})
	.delete(function(req, res) {
		Concept.delete(req.params.id);
		res.status(200).end();
	});

router.route('/concepts/:conceptId/reqs/:reqId')
	.post(function(req, res) {
		var params = req.params;
		Concept.addReqs(params.conceptId, params.reqId);
		res.status(200).end();
	})
	.delete(function(req, res) {
		var params = req.params;
		Concept.deleteReqs(params.conceptId, params.reqId);
		res.status(200).end();
	});

router.route('/concepts/:conceptId/materials')
	.post(function(req, res) {
	});

router.route('/concepts/:conceptId/materials/:materialId')
	.post(function(req, res) {
	})
	.delete(function(req, res) {
	});

router.route('/tags/search').get(function(req, res) {
	Tag.search(req.query.q).then(function(data) {
		res.json(data);
	});
});

app.use('/api', router);

app.listen(port);
console.log('HTTP running on http://localhost:' + port);