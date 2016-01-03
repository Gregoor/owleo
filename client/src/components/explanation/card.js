import React from 'react';
import Relay from 'react-relay';
import classnames from 'classnames';
import '../../../lib/embedly';

import shortenURL from '../../helpers/shorten-url';
import VoteExplanationMutation from '../../mutations/explanation/vote';
import DeleteExplanationMutation from '../../mutations/explanation/delete';
import {Button} from '../mdl';

const VOTE_ICON_STYLE = {fontSize: 40, marginLeft: -8};

class ExplanationCard extends React.Component {

  render() {
    const {explanation, user} = this.props;
    const {type, content, hasUpvoted, hasDownvoted} = explanation;
    return (
      <div className="mdl-card card-auto-fit"
           style={Object.assign({marginBottom: 8, overflow: 'visible'}, this.props.style)}>
        <div className="mdl-card__supporting-text">
          <div className="mdl-grid" style={{padding: 0}}>

            <div className="mdl-cell mdl-cell--1-col mdl-cell--stretch"
                 style={{margin: 0}}>
              <Button buttonType="icon" disabled={!user}
                      onClick={this._commitVote.bind(this, 'UP')}
                      title={'It explains the concept well ' + (hasUpvoted ? '(click again to undo)' : '')}>
                <i className={classnames('material-icons', {'accent-color': hasUpvoted})}
                   style={VOTE_ICON_STYLE}>
                  arrow_drop_up
                </i>
              </Button>
              <div style={{marginLeft: 11}}>{explanation.votes}</div>
              <Button buttonType="icon" disabled={!user}
                      onClick={this._commitVote.bind(this, 'DOWN')}
                      title={'It explains the concept badly ' + (hasDownvoted ? '(click again to undo)' : '')}>
                <i className={classnames('material-icons', {'accent-color': hasDownvoted})}
                   style={VOTE_ICON_STYLE}>
                  arrow_drop_down
                </i>
              </Button>
            </div>

            <div className="mdl-cell mdl-cell--11-col">
              {type == 'link' ?
                <div className="explanation">
                  <a href={content} className="embedly-card"
                     data-card-controls="0" data-card-chrome="0"
                     style={{wordWrap: 'break-word'}}>
                    {content.length > 50 ? shortenURL(content) : content}
                  </a>
                </div> :
                <div dangerouslySetInnerHTML={{__html: content}}/>
              }
            </div>

          </div>
        </div>
        {user ? (
          <div className="mdl-card__actions mdl-card--border">
            <Button onClick={this._onDelete.bind(this)}>
              Delete
            </Button>
          </div>
        ) : ''}
      </div>
    );
  }

  _commitVote(voteType) {
    Relay.Store.update(
      new VoteExplanationMutation({explanation: this.props.explanation, voteType}),
      {
        onSuccess: t => {
        },
        onFailure: t => console.error(t.getError().source.errors)
      }
    );
  }

  _onDelete() {
    if (!confirm('Do you really want to delete this explanation?')) return;
    Relay.Store.update(new DeleteExplanationMutation(),
      {
        onSuccess: t => {
          location.reload();
        },
        onFailure: t => console.error(t.getError().source.errors)
      }
    );
  }

}

export default Relay.createContainer(ExplanationCard, {

  fragments: {
    explanation: () => Relay.QL`
      fragment on Explanation {
        id
        content
        type
        votes
        hasUpvoted
        hasDownvoted
        ${VoteExplanationMutation.getFragment('explanation')}
      }
    `,
    user: () => Relay.QL`
      fragment on User {
        id
      }
    `
  }

})
