import path from 'path';
import _ from 'lodash';
import express from 'express';
import compression from 'compression';
import sessions from 'client-sessions';
import graphqlHTTP from 'express-graphql';
import cors from 'cors';
import favicon from 'serve-favicon';

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
  const userPromise = (user.id ?
    Promise.resolve(user.id) :
    User.createGuest().then(id => (user.id = id))
  ).then((id => User.find({id})));
  return {
    schema: require('./graphql/schema'),
    graphiql: true,
    rootValue: {
      getUser: () => userPromise,
      setUser: (id) => (user.id = id)
    }
  }
}));

app.use(favicon(__dirname + '/../client/favicon.ico'));
app.use('/study', express.static(__dirname + '/study'));

const STUDY_URL1 = 'https://docs.google.com/forms/d/1UtJQ9YvJzvIDnLWOMeRzUJkXYnTnReI3cwEe7d16IYI/viewform';
const STUDY_URL2 = 'https://docs.google.com/forms/d/1cR6_PZXdhkr4Z-T3W1pf1_4lvLbra4mL6TrwQph9iX8/viewform';
let redirectToFirst = true;
app.get('/study', (req, res) => {
  res.redirect(redirectToFirst ? STUDY_URL1 : STUDY_URL2);
  redirectToFirst = !redirectToFirst;
});
app.use('/static', express.static(__dirname + '/../client/dist/'));
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.prod.html'));
});

app.listen(config.port);

console.log(`Running on port ${config.port}`);
