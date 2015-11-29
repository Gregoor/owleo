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

let cor = cors({
  credentials: true,
  origin: (o, callback) => callback(null, true)
});
app.options('*', cor);
app.use(cor);
app.use(express.static('app/landingPage'));
app.use('/app', express.static(config.clientDir));
app.use(require('body-parser').json());


app.use('/graphql', graphqlHTTP(request => ({
  schema: require('./graphql/schema'),
  graphiql: true,
  rootValue: {
    user() {
      let {id} = request.user;
      if (!id) return Promise.resolve(null);
      return User.find({id});
    },
    logout() {
      request.user.id = null;
    }
  }
})));

app.listen(config.port);
