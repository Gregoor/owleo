import React, {Component} from 'react';
import Relay from 'react-relay';

import AppHomeRoute from './route-configs/app-home';
import ConceptList from './concept-list';

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://localhost:2323/graphql')
);

class App extends Component {
  render() {
    return (
      <Relay.RootContainer
        Component={ConceptList}
        route={new AppHomeRoute()}/>
    );
  }
}

export default App;
