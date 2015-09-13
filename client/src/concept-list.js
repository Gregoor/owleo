import React, {Component, PropTypes} from 'react';
import Relay from 'react-relay';

import ConceptListItem from './concept-list-item';

class ConceptList extends Component {

  static propTypes = {
    concept: PropTypes.object.isRequired,
    selectedId: PropTypes.string,
    onSelect: PropTypes.func,
    isRoot: PropTypes.bool
  };

  render() {
    let {concept, selectedId, onSelect, isRoot} = this.props;
    let {concepts} = concept;

    let subListsHTML = concepts ? concepts.map(concept => (
      <ConceptListItem key={concept.id} concept={concept}
                       selectedId={selectedId} onSelect={onSelect}/>
    )) : '';

    console.log(isRoot);
    let style = isRoot ? {} : {borderLeft: '1px solid #eee', marginLeft: '-25px'};
    return <ul style={style}>{subListsHTML}</ul>;
  }

}

ConceptList.defaultProps = {
  isRoot: true
};

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
