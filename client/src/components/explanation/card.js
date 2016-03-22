import React from 'react';
import Relay from 'react-relay';
import {
  Button, Card, CardMenu, CardText, Icon, IconButton,
  Menu, MenuItem
} from 'react-mdl';
import '../../../lib/embedly';

import VoteExplanationMutation from '../../mutations/explanation/vote';
import DeleteExplanationMutation from '../../mutations/explanation/delete';
import ExplanationForm from './form';
import ExplanationContent from './content';

const VOTE_ICON_STYLE = {fontSize: 40, marginLeft: -8};

class ExplanationCard extends React.Component {

  state = {isEditing: false};

  componentWillMount() {
    this._handleEdit = this._handleEdit.bind(this);
    this._handleDelete = this._handleDelete.bind(this);
  }

  render() {
    const {explanation, user} = this.props;

    if (this.state.isEditing) return (
      <ExplanationForm {...{explanation}} concept={null} hideSwitch
                       onDone={() => this.setState({isEditing: false})}/>
    );
    const {hasUpvoted, hasDownvoted} = explanation;
    const {isGuest} = user;

    const rand = Math.random();

    return (
      <Card style={Object.assign({marginBottom: 8, overflow: 'visible'},
                                 this.props.style)}>
        <CardText style={{display: 'flex'}}>
          <div style={{display: 'flex', flexDirection: 'column',
                       alignItems: 'center', width: 35}}>
            <Button ripple disabled={isGuest} accent={hasUpvoted}
                    className="mdl-button--icon"
                    onClick={this._commitVote.bind(this, 'UP')}
                    title={'It explains the concept well ' +
                            (hasUpvoted ? '(click again to undo)' : '')}>
              <Icon name="arrow_drop_up" style={VOTE_ICON_STYLE}/>
            </Button>
            <div>{explanation.votes}</div>
            <Button ripple disabled={isGuest} accent={hasDownvoted}
                    className="mdl-button--icon"
                    onClick={this._commitVote.bind(this, 'DOWN')}
                    title={'It explains the concept badly ' +
                            (hasDownvoted ? '(click again to undo)' : '')}>
              <Icon name="arrow_drop_down" style={VOTE_ICON_STYLE}/>
            </Button>
          </div>
          <ExplanationContent explanation={explanation}/>
        </CardText>
        {!user.isAdmin ? '' : (
          <CardMenu>
            <IconButton name="more_vert" id={'explanation-menu' + rand} />
            <Menu target={'explanation-menu' + rand}>
              <MenuItem ripple onClick={this._handleEdit}>Edit</MenuItem>
              <MenuItem ripple onClick={this._handleDelete}>Delete</MenuItem>
            </Menu>
          </CardMenu>
        )}
      </Card>
    );
  }

  _commitVote(voteType) {
    Relay.Store.commitUpdate(
      new VoteExplanationMutation({explanation: this.props.explanation, voteType}),
      {
        onSuccess: t => {
        },
        onFailure: t => console.error(t.getError().source.errors)
      }
    );
  }

  _handleEdit() {
    this.setState({isEditing: true});
  }

  _handleDelete() {
    if (!confirm('Do you really want to delete this explanation?')) return;
    const {explanation} = this.props;
    Relay.Store.commitUpdate(new DeleteExplanationMutation({explanation}),
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
        votes
        hasUpvoted
        hasDownvoted
        ${ExplanationForm.getFragment('explanation')}
        ${ExplanationContent.getFragment('explanation')}
        ${VoteExplanationMutation.getFragment('explanation')}
        ${DeleteExplanationMutation.getFragment('explanation')}
      }
    `,
    user: () => Relay.QL`
      fragment on User {
        id
        isAdmin
      }
    `
  }

})
