import Relay from 'react-relay';

class LogoutMutation extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation {logout}`;
  }

  getFatQuery() {
    return Relay.QL`
      fragment on LogoutPayload {
        success
      }
    `;
  }

  getVariables() {
    return {};
  }

  getConfigs() {
    return [{
      type: 'REQUIRED_CHILDREN',
      children: [Relay.QL`
        fragment on LogoutPayload {
          success
        }
      `]
    }];
  }

}

export default LogoutMutation;
