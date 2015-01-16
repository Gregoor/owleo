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

function conceptParams(req) {
	return _.pick(req.body.concept, 'name', 'summary', 'tags');
}

if (basicAuthPw) app.use(basicAuth('wurzel', basicAuthPw));
app.use(function(req, res, next) {
	// TODO: Check for prod
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');

	next();
});
app.use(express.static('../client/dist'));
app.use(bodyParser.json());

router.route('/concepts')
	.get(function(req, res) {
		Concept.all().then(res.json.bind(res));
	})
	.post(function(req, res) {
		Concept.create(conceptParams(req)).then(res.json.bind(res));
	});

router.route('/concepts/search').get(function(req, res) {
	Concept.search({'tags': req.query.tags.split(',')}).then(res.json.bind(res));
});

router.route('/concepts/:id')
	.get(function(req, res) {
		Concept.find(req.params.id).then(res.json.bind(res));
	})
	.post(function(req, res) {
		Concept.update(req.params.id, conceptParams(req)).then(res.json.bind(res));
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

router.route('/tags/search').get(function(req, res) {
	Tag.search(req.query.q).then(res.json.bind(res));
});

app.use('/api', router);

app.listen(port);
console.log('HTTP running on http://localhost:' + port);