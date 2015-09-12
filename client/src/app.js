import React, {Component} from 'react';
import Relay from 'react-relay';

import AppHomeRoute from './route-configs/app-home';
import Layout from './layout';

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://localhost:2323/graphql')
);

class App extends Component {

  render() {
    return <Relay.RootContainer route={new AppHomeRoute()} Component={Layout}/>;
  }

}

export default App;
