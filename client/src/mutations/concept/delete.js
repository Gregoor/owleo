import Relay from 'react-relay';
import _ from 'lodash';

export default class DeleteConceptMutation extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation{deleteConcept}`;
  }

  getVariables() {
    return _.pick(this.props, 'conceptId');
  }

  getFatQuery() {
    return Relay.QL`
      fragment on DeleteConceptPayload {
        success
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'REQUIRED_CHILDREN',
      children: [Relay.QL`
        fragment on DeleteConceptPayload {
          success
        }
      `]
    }];
  }

}
