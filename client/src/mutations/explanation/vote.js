import Relay from 'react-relay';
import _ from 'lodash';

export default class VoteExplanationMutation extends Relay.Mutation {

  static fragments = {
    explanation: () => Relay.QL`
      fragment on Explanation {
        id
        votes
        hasUpvoted
        hasDownvoted
      }
    `
  };

  getMutation() {
    return Relay.QL`mutation{voteExplanation}`;
  }

  getVariables() {
    const {explanation, voteType} = this.props;
    return {
      explanationId : explanation.id,
      voteType: this._getVoteTypeFor(voteType)
    };
  }

  getFatQuery() {
    return Relay.QL`
      fragment on VoteExplanationPayload {
        explanation {
          votes
          hasUpvoted
          hasDownvoted
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

  getOptimisticResponse() {
    const {explanation, voteType} = this.props;
    const {id, votes, hasUpvoted, hasDownvoted} = explanation;

    const newVoteType = this._getVoteTypeFor(voteType);
    const isUpvote = newVoteType == 'UP';
    const isDownvote = newVoteType == 'DOWN';

    let newVotes = votes;
    if (hasUpvoted) newVotes -= 1;
    else if (hasDownvoted) newVotes += 1;

    if (isUpvote) newVotes += 1;
    else if (isDownvote) newVotes -= 1;

    return {
      explanation: {
        id: id,
        hasUpvoted: isUpvote,
        hasDownvoted: isDownvote,
        votes: newVotes
      }
    };
  }

  _getVoteTypeFor(voteType) {
    const {hasUpvoted, hasDownvoted} = this.props.explanation;
    return voteType == 'UP' && hasUpvoted || voteType == 'DOWN' && hasDownvoted
      ? null : voteType;
  }

}
