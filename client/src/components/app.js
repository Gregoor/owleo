import React, {Component} from 'react';
import Relay from 'react-relay';
import {Router, Route, Redirect} from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory'
import {RelayRouter} from 'react-router-relay';
import {Spinner} from 'react-mdl';

import {BACKEND_URL, DEV_MODE} from '../config.custom';
import history from '../history';
import Layout from './layout';
import ConceptPage from './pages/nav/index';
import ConceptLearnPage from './pages/learn/';
import ConceptForm from './concept/form';
import AuthPage from './pages/auth';
import AboutPage from './pages/about';

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer(BACKEND_URL + 'graphql', {
    credentials: DEV_MODE ? 'include' : 'same-origin'
  })
);

if (!['simpleList', 'deepList', 'map'].includes(localStorage.navType)) {
  localStorage.removeItem('navType');
}

const ViewerQuery = {
  viewer: () => Relay.QL`query RootQuery { viewer }`
};

const commonProps = {
  renderLoading: () => <Spinner style={{left: '50%', top: '5px'}}/>,
  queries: ViewerQuery
};

const CreateConceptForm = ({viewer}) => (
  <ConceptForm viewer={viewer} concept={null}/>
);

export default () => (
  <RelayRouter history={history}>
    <Redirect from="/" to="/concepts"/>
    <Route path="/" component={Layout} {...commonProps}>
      <Route path="concepts" component={ConceptPage} {...commonProps}>
        <Route path="new" component={CreateConceptForm}/>
        <Route path=":path*"/>
      </Route>
      <Route path="learn/:path*" component={ConceptLearnPage} {...commonProps}/>
      <Route path="auth" component={AuthPage} {...commonProps}/>
      <Route path="about" component={AboutPage}/>
    </Route>
  </RelayRouter>
);
