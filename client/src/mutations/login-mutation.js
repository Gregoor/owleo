import Relay from 'react-relay';
import _ from 'lodash';

class LoginMutation extends Relay.Mutation {

  static fragments = {
    viewer: () => Relay.QL`fragment on Viewer { identities }`
  };

  getMutation() {
    return Relay.QL`mutation {login}`;
  }

  getVariables() {
    return _.pick(this.props, 'name', 'password');
  }

  getFatQuery() {
    return Relay.QL`
      fragment on LoginPayload {
        identityEdge,
        viewer {
          identities {
            id,
            name
          }
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'RANGE_ADD',
      parentName: 'viewer',
      parentID: this.props.viewer.id,
      connectionName: 'identities',
      edgeName: 'identityEdge',
      rangeBehaviors: {'': 'append'}
    }];
  }

}

export default LoginMutation;
