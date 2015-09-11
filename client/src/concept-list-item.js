import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptList from './concept-list';

class ConceptListItem extends Component {

  render() {
    let {concept} = this.props;

    let sublistHTML = '';
    if (this.props.relay.variables.expanded) {
      sublistHTML = <ConceptList concept={concept}/>;
    }

    let {name, conceptsCount} = concept;
    let hasConcepts = conceptsCount > 0;
    return (
      <li style={{listStyleType: hasConcepts ? 'disc' : 'circle'}}>
        <div onClick={this.onClickHead.bind(this)} style={{cursor: 'pointer'}}>
          ({conceptsCount}) {name}
        </div>
        {sublistHTML}
      </li>
    );
  }

  onClickHead() {
    this.props.relay.setVariables({expanded: true});
  }

}

ConceptListItem.defaultProps = {viewer: {}};

export default Relay.createContainer(ConceptListItem, {

  initialVariables: {
    expanded: false
  },

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        name,
        conceptsCount,
        ${ConceptList.getFragment('concept').if(variables.expanded)}
      }
    `
  }

});
