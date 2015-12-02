import React, {Component} from 'react';
import Relay from 'react-relay';
import {Router, Route, Redirect} from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory'
import {RelayRouter} from 'react-router-relay';

import {BACKEND_URL, DEV_MODE} from '../config.custom';
import history from '../history';
import Layout from './layout';
import ConceptPage from './concept/page';
import ConceptLearnPage from './concept/learn-page';
import ConceptForm from './concept/form';
import AuthPage from './auth-page';
import AboutPage from './about-page';
import {Spinner} from './mdl';

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer(BACKEND_URL + 'graphql', {
    credentials: DEV_MODE ? 'include' : 'same-origin'
  })
);

const ViewerQuery = {
  viewer: () => Relay.QL`query RootQuery { viewer }`
};

let commonProps = {renderLoading: () => <Spinner/>, queries: ViewerQuery};

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
      <Route path="learn/:targetId" component={ConceptLearnPage} {...commonProps}/>
      <Route path="id" component={ConceptPage} {...commonProps}>
        <Route path=":id"/>
      </Route>
      <Route path="auth" component={AuthPage} {...commonProps}/>
      <Route path="about" component={AboutPage}/>
    </Route>
  </RelayRouter>
);
