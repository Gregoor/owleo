import React from 'react';
import Relay from 'react-relay';
import _ from 'lodash';
import classnames from 'classnames';
import {FABButton, Icon, IconButton} from 'react-mdl';

import MasterConceptMutation from '../../../mutations/concept/master';

class MasterConceptButton extends React.Component {

  render() {
    const {concept, raised} = this.props;
    const {mastered} = concept;

    const props = Object.assign(
      {
        accent: mastered,
        title: 'I fully understand this concept',
        onClick: this._handleClick.bind(this)
      },
      _.omit(this.props, 'relay', 'concept')
    );

    return raised ?
      <FABButton {...props} ripple><Icon name="check"/></FABButton> :
      <IconButton name="check" {...props} ripple
                  className={classnames({'mdl-button--greyed': !mastered})}/>;
  }

  _handleClick() {
    const {concept} = this.props;
    Relay.Store.update(
      new MasterConceptMutation({concept, mastered: !concept.mastered})
    );
    this.props.onMaster();
  }

}

MasterConceptButton.defaultProps = {raised: true, onMaster: _.noop};

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
