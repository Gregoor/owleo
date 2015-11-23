import Relay from 'react-relay';
import _ from 'lodash';

export default class CreateExplanationMutation extends Relay.Mutation {

  static fragments = {
    concept: () => Relay.QL`
      fragment on Concept {
        id
      }
    `
  };

  getMutation() {
    return Relay.QL`mutation{createExplanation}`;
  }

  getVariables() {
    return Object.assign({conceptId: this.props.concept.id},
      _.pick(this.props, 'type', 'content'));
  }

  getFatQuery() {
    return Relay.QL`
      fragment on CreateExplanationPayload {
        success
      }
    `;
  }

  getConfigs() {
    return [
      {
        type: 'REQUIRED_CHILDREN',
        children: [Relay.QL`
          fragment on CreateExplanationPayload {
            success
          }
        `]
      }
      //{
      //  type: 'RANGE_ADD',
      //  parentName: 'concept',
      //  parentId: this.props.concept.id,
      //  connectionName: 'explanations',
      //  edgeName: 'explanationEdge',
      //  rangeBehaviors: {'': 'append'}
      //}
    ];
  }

}
