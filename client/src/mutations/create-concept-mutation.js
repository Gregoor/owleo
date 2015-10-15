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
        conceptEdge
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'RANGE_ADD',
      parentName: 'concept',
      parentID: this.props.container,
      connectionName: 'concepts',
      edgeName: 'conceptEdge',
      rangeBehaviors: {'': 'append'}
    }];
  }

  getOptimisticResponse() {
    return {conceptEdge: this.props};
  }

}
