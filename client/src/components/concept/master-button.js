import React from 'react';
import Relay from 'react-relay';
import _ from 'lodash';
import classnames from 'classnames';
import {FABButton, Icon} from 'react-mdl';

import MasterConceptsMutation from '../../mutations/concept/master';

class MasterConceptButton extends React.Component {

  componentWillMount() {
    const {id} = this.props.concept;
    this.props.relay.setVariables({id});
  }

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
                 ripple disabled={!this.props.relay.variables.id}>
        <Icon name="check"/>
      </FABButton>
    );
  }

  _handleClick() {
    const {learnPath} = this.props.viewer;
    const unmasteredReqNames = _(learnPath)
      .slice(0, -1)
      .filter(({mastered}) => !mastered)
      .map(({name}) => `"${name}"`)
      .value();

    const message = 'If you remark this concept as mastered its ' +
      'requirements ' + unmasteredReqNames + ' will be marked as well.';

    const {concept} = this.props;
    const mastered = !concept.mastered;
    if (!unmasteredReqNames.length || confirm(message)) {
      Relay.Store.update(new MasterConceptsMutation({
        conceptIDs: learnPath.map(({id}) => id), mastered
      }));
      if (mastered) this.props.onMaster();
    }
  }

}

MasterConceptButton.defaultProps = {onMaster: _.noop};

export default Relay.createContainer(MasterConceptButton, {

  initialVariables: {id: null},

  fragments: {

    viewer: () => Relay.QL`
      fragment on Viewer {
        learnPath(targetId: $id) {
          id
          name
          mastered
        }
      }
    `,

    concept: () =>  Relay.QL`
      fragment on Concept {
        id
        mastered
      }
    `

  }

});
