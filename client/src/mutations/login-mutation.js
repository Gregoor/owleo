import Relay from 'react-relay';
import _ from 'lodash';

class LoginMutation extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation {login}`;
  }

  getVariables() {
    return _.pick(this.props, 'name', 'password');
  }

  getFatQuery() {
    return Relay.QL`
      fragment on LoginPayload {
        success
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'REQUIRED_CHILDREN',
      children: [Relay.QL`
        fragment on LoginPayload {
          success
        }
      `]
    }];
  }

}

export default LoginMutation;
