import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptList from './concept-list';
import {pathToUrl} from './helpers';

class ConceptListItem extends Component {

  componentWillMount() {
    let {expanded} = this.props;
    if (expanded !== undefined) this.setExpanded(expanded);
  }

  componentWillReceiveProps(props) {
    let {expanded} = props;
    if (expanded !== undefined && this.props.expanded !== expanded) {
      this.setExpanded(expanded);
    }
  }

  render() {
    let {concept, selectedPath} = this.props;

    let sublist = '';
    if (this.props.relay.variables.includeSublist) {
      sublist = <ConceptList {...this.props} concept={concept} isRoot={false}/>;
    }

    let {id, name, conceptsCount} = concept;
    let headStyle = {
      display: 'inline-block',
      width: '100%',
      fontWeight: selectedPath ? 600: 'normal',
      cursor: 'pointer'
    };

    let buttonStyle = conceptsCount == 0 ?
      {width: '10px', height: '10px', left: '-30px', marginRight: '-20px'} : {};
    if (selectedPath) buttonStyle.border = '2px solid black';
    return (
      <li style={{listStyleType: 'none'}}>
        <button onClick={this.onClickButton.bind(this)} style={buttonStyle}>
          {conceptsCount || ''}
        </button>
        <a href={pathToUrl(concept.path)} style={headStyle}>
          {name}
        </a>
        <hr style={{width: '90%', borderColor: 'rgba(211,211,211,0.3)'}}/>
        {sublist}
      </li>
    );
  }

  onClickName() {
    this.setExpanded(true);
    this.props.onSelect(this.props.concept.id);
  }

  onClickButton() {
    this.setExpanded(!this.props.relay.variables.includeSublist);
  }

  setExpanded(state) {
    this.props.relay.setVariables({includeSublist: state});
  }

}

export default Relay.createContainer(ConceptListItem, {

  initialVariables: {
    includeSublist: false
  },

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        id,
        name,
        path,
        conceptsCount,
        ${ConceptList.getFragment('concept').if(variables.includeSublist)}
      }
    `
  }

});
