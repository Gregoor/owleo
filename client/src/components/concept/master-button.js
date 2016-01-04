import React from 'react';
import Relay from 'react-relay';

import {Button} from '../mdl';

import MasterConceptMutation from '../../mutations/concept/master';

class MasterConceptButton extends React.Component {

  render() {
    const {mastered} = this.props.concept;
    return (
      <Button buttonType={['icon', mastered ? 'accent' : 'greyed']}
              title="I fully understand this concept"
              onClick={this._handleClick.bind(this)}>
        <i className="material-icons">check</i>
      </Button>
    );
  }

  _handleClick() {
    const {concept} = this.props;
    Relay.Store.update(
      new MasterConceptMutation({concept, mastered: !concept.mastered})
    );
  }

}

export default Relay.createContainer(MasterConceptButton, {

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        mastered
        ${MasterConceptMutation.getFragment('concept')}
      }
    `
  }

});
