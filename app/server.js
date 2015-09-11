import _ from 'lodash';
import express from 'express';
import compression from 'compression';
import router from './router';
import sessions from 'client-sessions';
import graphqlHTTP from 'express-graphql';
import cors from 'cors';

let config = require('./configs/config');
try {
  config = _.defaults(require('./configs/config.custom'), config);
} catch (e) {
  if (!(e instanceof Error && e.code === 'MODULE_NOT_FOUND')) throw e;
}
let app = express();

app.use(sessions({
  'cookieName': 'user',
  'secret': 'soon',
  'duration': 1000 * 60 * 60 * 24 * 7,
  'cookie': {
    'path': '/api'
    //'secureProxy': 'DOME' //TODO: Srsly
  }
}));

app.use(compression());

app.use(cors());
app.use(express.static('app/landingPage'));
app.use('/app', express.static(config.clientDir));
app.use(require('body-parser').json());

app.use('/api', router);
app.use('/graphql', graphqlHTTP({schema: require('./graphql/schema')}));

app.listen(config.port);
