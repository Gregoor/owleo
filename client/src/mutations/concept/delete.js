import Relay from 'react-relay';
import _ from 'lodash';

export default class DeleteConceptMutation extends Relay.Mutation {

  static fragments = {
    concept: () => Relay.QL`
      fragment on Concept {
        id
      }
    `
  };

  getMutation() {
    return Relay.QL`mutation{deleteConcept}`;
  }

  getVariables() {
    return {conceptID: this.props.concept.id}
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
