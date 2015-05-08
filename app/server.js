import _ from 'lodash';
import express from 'express';
import router from './router';

let config = require('./config');
try {
	config = _.defaults(require('./config.custom'), config);
} catch (e) {
	if (!(e instanceof Error && e.code === 'MODULE_NOT_FOUND')) throw e;
}
let app = express();

let {auth} = config;
if (auth) app.use(require('basic-auth-connect')(auth.user, auth.pw));

app.use((req, res, next) => {
	// TODO: Check for prod
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');

	next();
});
app.use(express.static(config.clientDir));
app.use(require('body-parser').json());

app.use('/api', router);

app.listen(config.port);