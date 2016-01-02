import Relay from 'react-relay';

export default class MasterConceptMutation extends Relay.Mutation {

  static fragments = {
    concept: () => Relay.QL`
      fragment on Concept {
        id
      }
    `
  };

  getMutation() {
    return Relay.QL`mutation{masterConcept}`;
  }

  getVariables() {
    const {concept, mastered} = this.props;
    return {conceptID: concept.id, mastered};
  }

  getFatQuery() {
    return Relay.QL`
      fragment on MasterConceptPayload {
        concept {
          mastered
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {concept: this.props.concept.id}
    }];
  }

  getOptimisticResponse() {

    return {
      concept: {
        mastered: this.props.mastered
      }
    };
  }

}
