import path from 'path';
import _ from 'lodash';
import express from 'express';
import compression from 'compression';
import sessions from 'client-sessions';
import graphqlHTTP from 'express-graphql';
import cors from 'cors';
import favicon from 'serve-favicon';
import 'babel-polyfill';

import User from './db/user';

let {config} = require('./configs/config');

try {
  config = _.defaults(require('./configs/config.custom').config, config);
} catch (e) {
  if (!(e instanceof Error && e.code === 'MODULE_NOT_FOUND')) throw e;
}
let app = express();

if (config.dev) {
  const corsResponse = cors({
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
app.use('/graphql', graphqlHTTP(({user}) => {
  if (user.id && user.id.length > 3) user.id = null;
  const userPromise = (user.id ?
    Promise.resolve(user.id) :
    User.createGuest().then(id => (user.id = id))
  ).then((id => User.findOne({id})));
  return {
    schema: require('./graphql/schema').Schema,
    graphiql: true,
    rootValue: {
      getUser: () => userPromise,
      setUser: (id) => (user.id = id)
    },
    formatError(error) {
      return config.dev ? {
        message: error.message,
        locations: error.locations,
        stack: error.stack
      } : {message: 'Error in der Hose'};
    }
  }
}));

app.use(favicon(__dirname + '/../client/favicon.ico'));
app.use('/study', express.static(__dirname + '/study'));

app.use('/static', express.static(__dirname + '/../client/dist/'));
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.prod.html'));
});

app.listen(config.port);

console.log(`Running on port ${config.port}`);
