import React from 'react';
import Relay from 'react-relay';
import classnames from 'classnames';
import {Button, Card, CardActions, CardText, Icon} from 'react-mdl';
import '../../../lib/embedly';

import shortenURL from '../../helpers/shorten-url';
import VoteExplanationMutation from '../../mutations/explanation/vote';
import DeleteExplanationMutation from '../../mutations/explanation/delete';

const VOTE_ICON_STYLE = {fontSize: 40, marginLeft: -8};

class ExplanationCard extends React.Component {

  render() {
    const {explanation, user} = this.props;
    const {type, content, hasUpvoted, hasDownvoted} = explanation;
    return (
      <Card style={Object.assign({marginBottom: 8, overflow: 'visible'},
                                 this.props.style)}>
        <CardText style={{display: 'flex'}}>
          <div style={{display: 'flex', flexDirection: 'column',
                       alignItems: 'center', width: 35}}>
            <Button ripple disabled={!user} accent={hasUpvoted}
                    className="mdl-button--icon"
                    onClick={this._commitVote.bind(this, 'UP')}
                    title={'It explains the concept well ' +
                            (hasUpvoted ? '(click again to undo)' : '')}>
              <Icon name="arrow_drop_up" style={VOTE_ICON_STYLE}/>
            </Button>
            <div>{explanation.votes}</div>
            <Button ripple disabled={!user} accent={hasDownvoted}
                    className="mdl-button--icon"
                    onClick={this._commitVote.bind(this, 'DOWN')}
                    title={'It explains the concept badly ' +
                            (hasDownvoted ? '(click again to undo)' : '')}>
              <Icon name="arrow_drop_down" style={VOTE_ICON_STYLE}/>
            </Button>
          </div>

          {type == 'link' ?
            <div className="explanation">
              <a href={content} className="embedly-card"
                 data-card-controls="0" data-card-chrome="0"
                 style={{wordWrap: 'break-word'}}>
                {content.length > 50 ? shortenURL(content) : content}
              </a>
            </div> :
            <div dangerouslySetInnerHTML={{__html: content}}
                 style={{margin: 8}}/>
          }
        </CardText>
        {user ? (
          <CardActions>
            <Button onClick={this._handleDelete.bind(this)}>
              Delete
            </Button>
          </CardActions>
        ) : ''}
      </Card>
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

  _handleDelete() {
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
