import React, {Component} from 'react';
import Relay from 'react-relay';
import {Router, Route, Redirect} from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory'
import ReactRouterRelay from 'react-router-relay';

import Layout from './layout';
import ConceptPage from './concept/page';
import AuthPage from './auth-page';

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://localhost:2323/graphql')
);

const ViewerQuery = {
  viewer: () => Relay.QL`query RootQuery { viewer }`
};

let renderLoading = () => (
  <div className="mdl-spinner mdl-js-spinner is-active"
       style={{left: '50%', top: '5px'}}/>
);

export default () => (
  <Router //history={createBrowserHistory()}
          createElement={ReactRouterRelay.createElement}>
    <Redirect from="/" to="/concepts"/>
    <Route path="/" component={Layout}>
      <Route path="concepts" component={ConceptPage} queries={ViewerQuery}
             {...{renderLoading}}>
        <Route path=":path*"/>
      </Route>
      <Route path="id" component={ConceptPage} queries={ViewerQuery}
        {...{renderLoading}}>
        <Route path=":id"/>
      </Route>
      <Route path="/auth" component={AuthPage} queries={ViewerQuery}
             {...{renderLoading}}/>
    </Route>
  </Router>
);
