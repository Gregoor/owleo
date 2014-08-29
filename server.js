var express = require('express'),
	app = express(),
	router = express.Router(),

	bodyParser = require('body-parser'),

	port = process.env.PORT || 8080,

	Concept = require('./app/models/concept.js');

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');

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
	.post(function(req, res) {
		var concept = new Concept({id: parseInt(req.params.id)});
		concept.addReqs(req.body.reqs, function() {
			res.json(concept);
		});
	});

app.use('/api', router);

app.listen(port);
console.log('HTTP running on http://localhost:' + port);