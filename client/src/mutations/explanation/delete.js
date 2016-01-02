import Relay from 'react-relay';
import _ from 'lodash';

export default class DeleteExplanationMutation extends Relay.Mutation {

  static fragments = {
    explanation: () => Relay.QL`
      fragment on Explanation {
        id
      }
    `
  };

  getMutation() {
    return Relay.QL`mutation{deleteExplanation}`;
  }

  getVariables() {
    return {explanationID: this.props.explanation.id}
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
