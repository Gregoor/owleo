import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptList from './concept-list';

class ConceptListItem extends Component {

  render() {
    let {concept, selectedId, onSelect} = this.props;

    let sublistHTML = '';
    if (this.props.relay.variables.expanded) {
      sublistHTML = (
        <ConceptList concept={concept} selectedId={selectedId}
                     onSelect={onSelect}/>
      );
    }

    let {name, conceptsCount} = concept;
    let headStyle = {
      cursor: 'pointer',
      fontWeight: selectedId == concept.id ? 600: 'normal'
    };
    return (
      <li style={{listStyleType: conceptsCount > 0 ? 'disc' : 'circle'}}>
        <div onClick={this.onClickHead.bind(this)} style={headStyle}>
          ({conceptsCount}) {name}
        </div>
        {sublistHTML}
      </li>
    );
  }

  onClickHead() {
    this.props.relay.setVariables({
      expanded: !this.props.relay.variables.expanded
    });
    this.props.onSelect(this.props.concept.id);
  }

}

export default Relay.createContainer(ConceptListItem, {

  initialVariables: {
    expanded: false
  },

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        id,
        name,
        conceptsCount,
        ${ConceptList.getFragment('concept').if(variables.expanded)}
      }
    `
  }

});
