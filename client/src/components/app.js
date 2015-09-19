import React, {Component} from 'react';
import Relay from 'react-relay';
import {Router, Route, Redirect} from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory'
import ReactRouterRelay from 'react-router-relay';

import Layout from './layout';
import ConceptPage from './concept/_page';
import AuthPage from './auth-page';


Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://localhost:2323/graphql')
);

const ViewerQuery = {
  viewer: () => Relay.QL`query RootQuery { viewer }`
};

export default () => (
  <Router //history={createBrowserHistory()}
          createElement={ReactRouterRelay.createElement}>
    <Redirect from="/" to="/concepts"/>
    <Route path="/" component={Layout}>
      <Route path="concepts" component={ConceptPage} queries={ViewerQuery}>
        <Route path=":path*"/>
      </Route>
      <Route path="/auth" component={AuthPage}/>
    </Route>
  </Router>
);
