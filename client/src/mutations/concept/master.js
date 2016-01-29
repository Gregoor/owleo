import Relay from 'react-relay';

export default class MasterConceptsMutation extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation{masterConcept}`;
  }

  getVariables() {
    const {conceptIDs, mastered} = this.props;
    return {conceptIDs, mastered};
  }

  getFatQuery() {
    return Relay.QL`
      fragment on MasterConceptPayload {
        concepts {
          mastered
        }
      }
    `;
  }

  getConfigs() {
    return this.props.conceptIDs.map((id) => ({
      type: 'FIELDS_CHANGE',
      fieldIDs: {concepts: id}
    }));
  }

  getOptimisticResponse() {
    const {mastered} = this.props;
    return {
      concepts: this.props.conceptIDs.map(() => ({mastered}))
    };
  }

}
