var express = require('express'),
	app = express(),
	router = express.Router(),

	bodyParser = require('body-parser'),

	port = process.env.PORT || 8080,

	Concept = require('./app/models/concept.js');

app.use(bodyParser.json());

router.route('/concepts')
	.get(function(req, res) {
		Concept.all(function(err, data) {
			res.json(data.map(function(node) {
				return node.attrs;
			}));
		});
	})
	.post(function(req, res) {
		Concept.create(req.body.concept.name, function(err, data) {
			res.json(data[0].attrs);
		});
	});


app.use('/api', router);

app.listen(port);
console.log('HTTP running on http://localhost:' + port);