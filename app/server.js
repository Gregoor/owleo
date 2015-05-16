import _ from 'lodash';
import express from 'express';
import router from './router';
import sessions from 'client-sessions';

let config = require('./configs/config');
try {
	config = _.defaults(require('./configs/config.custom'), config);
} catch (e) {
	if (!(e instanceof Error && e.code === 'MODULE_NOT_FOUND')) throw e;
}
let app = express();

let {auth} = config;
if (auth) app.use(require('basic-auth-connect')(auth.user, auth.pw));

app.use(sessions({
    'cookieName': 'user',
    'secret': 'soon',
    'duration': 1000 * 60 * 60 * 24 * 7,
    'cookie': {
        'path': '/api'
        //'secureProxy': 'DOME' //TODO: Srsly
    }
}));

app.use((req, res, next) => {
	if (config.dev) {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', req.get('origin'));
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
        res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    }

	next();
});
app.use(express.static(config.clientDir));
app.use(require('body-parser').json());

app.use('/api', router);

app.listen(config.port);