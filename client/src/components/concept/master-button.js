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
      _.omit(this.props, 'relay', 'concept', 'onMaster')
    );

    return (
      <FABButton className={classnames({'color--valid': mastered})} {...props}
                 ripple>
        <Icon name="check"/>
      </FABButton>
    );
  }

  _handleClick() {
    const {learnPath} = this.props.concept;
    const unmasteredReqNames = _(learnPath)
      .slice(0, -1)
      .filter(({mastered}) => !mastered)
      .map(({name}) => `"${name}"`)
      .value();

    const message = 'If you remark this concept as mastered its ' +
      `requirements ${unmasteredReqNames} will be marked as well.`;

    const {concept} = this.props;
    const mastered = !concept.mastered;
    if (!unmasteredReqNames.length || confirm(message)) Relay.Store.commitUpdate(
      new MasterConceptsMutation({
        conceptIDs: mastered ? learnPath.map(({id}) => id) : [concept.id],
        mastered
      }),
      {onSuccess: () => mastered && this.props.onMaster()}
    );
  }

}

MasterConceptButton.defaultProps = {onMaster: _.noop};

export default Relay.createContainer(MasterConceptButton, {

  fragments: {
    concept: () =>  Relay.QL`
      fragment on Concept {
        id
        mastered
        learnPath(mastered: false) {
          id
          name
          mastered
        }
      }
    `
  }

});
