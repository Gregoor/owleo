import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import express from 'express';
import compression from 'compression';
import sessions from 'client-sessions';
import graphqlHTTP from 'express-graphql';
import cors from 'cors';
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

const secretFilePath = path.join(__dirname, 'secret.key');
if (!fs.existsSync(secretFilePath)) {
  throw 'Missing secret, run npm task "create-secret"';
}

app.use(sessions({
  cookieName: 'user',
  secret: fs.readFileSync(secretFilePath),
  duration: 1000 * 60 * 60 * 24 * 366,
  cookie: {
    secureProxy: !config.dev
  }
}));
app.use(compression());
app.use(require('body-parser').json());

app.use('/cookie', (req, res) => {
  const {user} = req;
  if (user.id && user.id.length > 3) user.id = null;
  (user.id ?
    Promise.resolve(user.id) :
    User.createGuest().then(id => (user.id = id))
  )
    .then((id) => User.findOne({id}))
    .then((user) => {
      req.user = user;
      res.end();
    });
});

app.use((req, res, next) => req.user.id ? next() : res.status(401).json({
  error: 'Get yourself a "/cookie" first'
}));
app.use('/graphql', graphqlHTTP((req) => {
  return {
    schema: require('./graphql/schema').Schema,
    graphiql: true,
    context: {
      getUser: () => Promise.resolve(req.user),
      setUser: (id) => (req.user = {id})
    },
    formatError({message, locations, stack}) {
      if (config.dev) {
        return {message, locations, stack};
      } else {
        console.error(message, locations, stack);
        return {message: 'Error in der Hose'};
      }
    }
  }
}));

app.listen(config.port);

console.log(`Running on port ${config.port}`);
