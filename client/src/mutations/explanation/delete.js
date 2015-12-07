import Relay from 'react-relay';
import _ from 'lodash';

export default class DeleteExplanationMutation extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation{deleteExplanation}`;
  }

  getVariables() {
    return {explanationId: this.props.id}
  }

  getFatQuery() {
    return Relay.QL`
      fragment on DeleteExplanationPayload {
        success
      }
    `;
  }

  getConfigs() {
    return [
      {
        type: 'REQUIRED_CHILDREN',
        children: [Relay.QL`
          fragment on DeleteExplanationPayload {
            success
          }
        `]
      }
    ];
  }

}
