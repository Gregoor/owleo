import Relay from 'react-relay';
import _ from 'lodash';

export default class UpdateExplanationMutation extends Relay.Mutation {

  static fragments = {
    explanation: () => Relay.QL`
      fragment on Explanation {
        id
      }
    `
  };

  getMutation() {
    return Relay.QL`mutation{updateExplanation}`;
  }

  getVariables() {
    const {content} = this.props;
    return {explanationID: this.props.explanation.id, content};
  }

  getFatQuery() {
    return Relay.QL`
      fragment on UpdateExplanationPayload {
        explanation {
          content
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {explanation: this.props.explanation.id}
    }];
  }

}
