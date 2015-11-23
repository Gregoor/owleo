import Relay from 'react-relay';
import _ from 'lodash';

export default class UpdateConceptMutation extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation{updateConcept}`;
  }

  getVariables() {
    return _.pick(this.props,
      'id', 'name', 'container', 'reqs', 'summary', 'summarySource'
    );
  }

  getFatQuery() {
    return Relay.QL`
      fragment on UpdateConceptPayload {
        success
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'REQUIRED_CHILDREN',
      children: [Relay.QL`
        fragment on UpdateConceptPayload {
          success
        }
      `]
    }];
  }

}
