import React, {Component} from 'react';
import Relay from 'react-relay';
import {Router, Route} from 'react-router';

import AppHomeRoute from './route-configs/app-home';
import Layout from './layout';

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://localhost:2323/graphql')
);

class App extends Component {

  render() {
    return <Relay.RootContainer route={new AppHomeRoute()} Component={Layout}
                                renderFetched={this.renderLayout.bind(this)}/>;
  }

  renderLayout(data) {
    let {path, splat} = this.props.params;
    return <Layout path={path + splat} {...data}/>
  }

}

export default () => (
  <Router>
    <Route path="/">
      <Route path=":path*" component={App}/>
    </Route>
  </Router>
);
