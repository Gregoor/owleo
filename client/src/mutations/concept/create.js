import Relay from 'react-relay';
import _ from 'lodash';

export default class CreateConceptMutation extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation{createConcept}`;
  }

  getVariables() {
    return _.pick(this.props,
      'name', 'container', 'reqs', 'summary', 'summarySource'
    );
  }

  getFatQuery() {
    return Relay.QL`
      fragment on CreateConceptPayload {
        conceptID
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'REQUIRED_CHILDREN',
      children: [Relay.QL`
        fragment on CreateConceptPayload {
          conceptID
        }
      `]
    }];
  }

}
