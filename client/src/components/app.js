import React, {Component} from 'react';
import Relay from 'react-relay';
import {Router, Route, Redirect} from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory'
import {RelayRouter} from 'react-router-relay';

import Layout from './layout';
import ConceptPage from './concept/page';
import ConceptForm from './concept/form';
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

let commonProps = {renderLoading, queries: ViewerQuery};

export default () => (
  <RelayRouter /*history={createBrowserHistory()}*/>
    <Redirect from="/" to="/concepts"/>
    <Route path="/" component={Layout}>
      <Route path="concepts" component={ConceptPage} {...commonProps}>
        <Route path="new" component={ConceptForm}/>
        <Route path=":path*"/>
      </Route>
      <Route path="id" component={ConceptPage} {...commonProps}>
        <Route path=":id"/>
      </Route>
      <Route path="auth" component={AuthPage} {...commonProps}/>
    </Route>
  </RelayRouter>
);
