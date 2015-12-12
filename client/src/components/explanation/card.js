import React from 'react';
import Relay from 'react-relay';

import DeleteExplanationMutation from '../../mutations/explanation/delete';
import ExplanationContent from './content';
import {Button} from '../mdl';

class ExplanationCard extends React.Component {

  render() {
    let {explanation, user} = this.props;
    return (
      <div style={Object.assign({marginBottom: 8}, this.props.style)}
           className="mdl-card card-auto-fit">
        <div className="mdl-card__supporting-text"
             style={explanation.type == 'link' ? {width: '100%', padding: 0} : {}}>
          <ExplanationContent explanation={explanation}/>
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

  _onDelete() {
    if (!confirm('Do you really want to delete this explanation?')) return;
    Relay.Store.update(
      new DeleteExplanationMutation({id: this.props.explanation.id}),
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
        type
        ${ExplanationContent.getFragment('explanation')}
      }
    `,
    user: () => Relay.QL`
      fragment on User {
        id
      }
    `
  }

})
