import React, {Component} from 'react';
import Relay from 'react-relay';
import {Router, Route, Redirect} from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory'
import ReactRouterRelay from 'react-router-relay';

import Layout from './layout';
import AuthForm from './auth-form';


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
    <Route path="/">
      <Route path="concepts" component={Layout} queries={ViewerQuery}>
        <Route path=":path*"/>
      </Route>
      <Route path="/auth" component={AuthForm}/>
    </Route>
  </Router>
);
