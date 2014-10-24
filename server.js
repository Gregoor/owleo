var express = require('express'),
	app = express(),
	router = express.Router(),

	bodyParser = require('body-parser'),

	port = process.env.PORT || 8080,

	Concept = require('./app/models/concept.js');

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
		Concept.all(function(concepts) {
			res.json(concepts.map(function(concept) {
				return concept.attrs;
			}));
		});
	})
	.post(function(req, res) {
		Concept.create(req.body, function(concept) {
			res.json(concept.attrs);
		});
	});

router.route('/concepts/:id')
	.get(function(req, res) {
		Concept.find(req.params.id, function(concept) {
			res.json(concept.attrs);
		});
	})
	.post(function(req, res) {
		var concept = new Concept({id: req.params.id});
		concept.addReqs(req.body.reqs, function() {
			res.json(concept);
		});
	})
	.delete(function(req, res) {
		var concept = new Concept({id: req.params.id});
		concept.delete(function() {
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

app.use('/api', router);

app.listen(port);
console.log('HTTP running on http://localhost:' + port);