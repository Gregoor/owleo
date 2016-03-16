import React from 'react';
import Relay from 'react-relay';
import _ from 'lodash';
import classnames from 'classnames';
import {FABButton, Icon} from 'react-mdl';

import LearnConceptDialog from './learn-dialog';

class LearnConceptButton extends React.Component {

  state = {showDialog: false};

  render() {
    const {concept} = this.props;
    const {mastered} = concept;

    const props = Object.assign(
      {
        title: 'Learn about this concept',
        onClick: this._handleClick.bind(this)
      },
      _.omit(this.props, 'relay', 'concept')
    );

    const dialog = this.state.showDialog ?
      <LearnConceptDialog {...{concept}}
                          onClose={() => this.setState({showDialog: false})}/> :
      '';

    return (
      <div>
        {dialog}
        <FABButton className={classnames({'color--valid': mastered})} {...props}
                   ripple>
          <Icon name="school"/>
        </FABButton>
      </div>
    );
  }

  _handleClick() {
    this.setState({showDialog: true});
  }

}

export default Relay.createContainer(LearnConceptButton, {

  fragments: {

    concept: () =>  Relay.QL`
      fragment on Concept {
        ${LearnConceptDialog.getFragment('concept')}
      }
    `

  }

});
