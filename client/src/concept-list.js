import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptListItem from './concept-list-item';

class ConceptList extends Component {

  render() {
    let {concepts} = this.props.concept;

    let subListsHTML = concepts ? concepts.map(concept => (
      <ConceptListItem key={concept.id} concept={concept}/>
    )) : '';

    return <ul>{subListsHTML}</ul>;
  }

}

export default Relay.createContainer(ConceptList, {

  fragments: {
    concept: () =>  Relay.QL`
      fragment on Concept {
        concepts {
          id,
          ${ConceptListItem.getFragment('concept')}
        }
      }
    `
  }

});
