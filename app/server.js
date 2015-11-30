import path from 'path';
import _ from 'lodash';
import express from 'express';
import compression from 'compression';
import sessions from 'client-sessions';
import graphqlHTTP from 'express-graphql';
import cors from 'cors';

import User from './db/user';
import bodyParser from 'body-parser';

let config = require('./configs/config');
try {
  config = _.defaults(require('./configs/config.custom'), config);
} catch (e) {
  if (!(e instanceof Error && e.code === 'MODULE_NOT_FOUND')) throw e;
}
let app = express();

if (config.dev) {
  let corsResponse = cors({
    credentials: true,
    origin: (o, callback) => callback(null, true)
  });
  app.options('*', corsResponse);
  app.use(corsResponse);
}

app.use(sessions({
  cookieName: 'user',
  secret: 'soon', //TODO
  duration: 1000 * 60 * 60 * 24 * 7,
  cookie: {
    path: '/graphql'
    //secureProxy: 'DOME' //TODO: Srsly
  }
}));
app.use(compression());
app.use(require('body-parser').json());
app.use('/graphql', graphqlHTTP(request => ({
  schema: require('./graphql/schema'),
  graphiql: true,
  rootValue: {
    user: request.user
  }
})));

app.use('/static', express.static(__dirname + '/../client/dist/'));
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(config.port);
