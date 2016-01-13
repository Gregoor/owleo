import React from 'react';
import Relay from 'react-relay';
import {FABButton, Icon} from 'react-mdl';
import _ from 'lodash';

import MasterConceptMutation from '../../../mutations/concept/master';

class MasterConceptButton extends React.Component {

  render() {
    const {mastered} = this.props.concept;
    return (
      <FABButton accent={mastered} title="I fully understand this concept"
                 onClick={this._handleClick.bind(this)}
                 {..._.omit(this.props, 'relay', 'concept')}>
        <Icon name="check"/>
      </FABButton>
    )
  }

  _handleClick() {
    const {concept} = this.props;
    Relay.Store.update(
      new MasterConceptMutation({concept, mastered: !concept.mastered})
    );
    this.props.onMaster();
  }

}

MasterConceptButton.defaultProps = {onMaster: _.noop};

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
