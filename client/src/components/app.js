import React, {Component} from 'react';
import Relay from 'react-relay';
import {Router, Route, Redirect, applyRouterMiddleware} from 'react-router';
import useRelay from 'react-router-relay';
import {Spinner} from 'react-mdl';

import {BACKEND_URL, DEV_MODE} from '../config';
import history from '../history';
import Layout from './layout';
import ConceptPage from './pages/nav/index';
import ConceptLearnPage from './pages/learn/';
import ConceptForm from './concept/form';
import AuthPage from './pages/auth';
import AboutPage from './pages/about';
import UnapprovedPage from './pages/unapproved';

const fetchOptions = {
  credentials: 'include'
};

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer(BACKEND_URL + 'graphql', fetchOptions)
);

fetch(BACKEND_URL + 'cookie', fetchOptions);

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
  <Router history={history} render={applyRouterMiddleware(useRelay)}
          environment={Relay.Store}>
    <Redirect from="/" to="/concepts"/>
    <Route path="/" component={Layout} {...commonProps}>
      <Route path="auth" component={AuthPage} {...commonProps}/>
      <Route path="concepts" component={ConceptPage} {...commonProps}>
        <Route path="new" component={CreateConceptForm}/>
        <Route path=":path*"/>
      </Route>
      <Route path="search/:query" component={ConceptPage} {...commonProps}/>
      <Route path="learn/:path*" component={ConceptLearnPage} {...commonProps}/>
      <Route path="unapproved" component={UnapprovedPage} {...commonProps}/>
      <Route path="about" component={AboutPage}/>
    </Route>
  </Router>
);

