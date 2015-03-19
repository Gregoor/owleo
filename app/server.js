let _ = require('lodash');
let express = require('express');
let app = express();
let router = express.Router();

let basicAuth = require('basic-auth-connect');
let bodyParser = require('body-parser');

let port = process.env.PORT || 8080;

let basicAuthPw = process.env.SKILLGRAPH_PW;

let Tag = require('./models/tag.js');

if (basicAuthPw) app.use(basicAuth('wurzel', basicAuthPw));
app.use((req, res, next) => {
	// TODO: Check for prod
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');

	next();
});
app.use(express.static('../client/dist'));
app.use(bodyParser.json());

require('./controllers/concept-controller')(router);

router.route('/tags/search').get((req, res) => {
	Tag.search(req.query.q).then(res.json.bind(res));
});

app.use('/api', router);

app.listen(port);
console.log('HTTP running on http://localhost:' + port);