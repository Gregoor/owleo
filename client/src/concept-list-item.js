import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptList from './concept-list';

class ConceptListItem extends Component {

  render() {
    let {concept, selectedId, onSelect} = this.props;

    let sublist = '';
    if (this.props.relay.variables.expanded) {
      sublist = (
        <ConceptList concept={concept} selectedId={selectedId}
                     onSelect={onSelect} isRoot={false}/>
      );
    }

    let {id, name, conceptsCount} = concept;
    let headStyle = {
      cursor: 'pointer',
      fontWeight: selectedId == id ? 600: 'normal'
    };
    return (
      <li style={{listStyleType: 'none'}}>
        <button onClick={this.onClickButton.bind(this)} style={conceptsCount == 0 ? {width: '10px', height: '10px', left: '-30px', marginRight: '-20px'} : {}}>
          {conceptsCount || ''}
        </button>
        <span onClick={this.onClickName.bind(this)} style={headStyle}>
          {name}
        </span>
        {sublist}
      </li>
    );
  }

  onClickName() {
    this.props.relay.setVariables({expanded: true});
    this.props.onSelect(this.props.concept.id);
  }

  onClickButton() {
    this.props.relay.setVariables({
      expanded: !this.props.relay.variables.expanded
    });
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
