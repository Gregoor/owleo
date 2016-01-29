import React from 'react';
import Relay from 'react-relay';
import _ from 'lodash';
import classnames from 'classnames';
import {FABButton, Icon} from 'react-mdl';

import MasterConceptsMutation from '../../mutations/concept/master';

class MasterConceptButton extends React.Component {

  render() {
    const {concept} = this.props;
    const {mastered} = concept;

    const props = Object.assign(
      {
        title: 'I fully understand this concept',
        onClick: this._handleClick.bind(this)
      },
      _.omit(this.props, 'relay', 'concept')
    );

    return (
      <FABButton className={classnames({'color--valid': mastered})} {...props}
                 ripple>
        <Icon name="check"/>
      </FABButton>
    );
  }

  _handleClick() {
    const {concept} = this.props;
    const mastered = !concept.mastered;
    Relay.Store.update(
      new MasterConceptsMutation({conceptIDs: [concept.id], mastered})
    );
    if (mastered) this.props.onMaster();
  }

}

MasterConceptButton.defaultProps = {onMaster: _.noop};

export default Relay.createContainer(MasterConceptButton, {

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        id
        mastered
      }
    `
  }

});
