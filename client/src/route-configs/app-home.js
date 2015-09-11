import Relay from 'react-relay';

export default class extends Relay.Route {
  static queries = {
    concept: () => Relay.QL`query RootQuery { viewer }`
  };
  static routeName = 'AppHomeRoute';
}
