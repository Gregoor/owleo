import Relay from 'react-relay';
import _ from 'lodash';

class RegisterMutation extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation {register}`;
  }

  getVariables() {
    return _.pick(this.props, 'name', 'password');
  }

  getFatQuery() {
    return Relay.QL`
      fragment on RegisterPayload {
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

export default RegisterMutationMutation;
