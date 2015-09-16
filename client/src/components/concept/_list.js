import React, {Component, PropTypes} from 'react';
import Relay from 'react-relay';

import ConceptListItem from './_list-item';

class ConceptList extends Component {

  static propTypes = {
    concept: PropTypes.object.isRequired,
    isRoot: PropTypes.bool
  };

  render() {
    let {concept, selectedPath, isRoot} = this.props;
    let {concepts} = concept;

    let topPath;
    let restPath = [];
    if (selectedPath) {
      restPath = selectedPath.slice() ;
      topPath = restPath.shift();
    }
    let subListsHTML = concepts ? concepts.map(concept => {
      let isOpenProps = topPath == concept.name ?
        {selectedPath: restPath, expanded: true} : {};

      return <ConceptListItem key={concept.id} concept={concept}
                              {...isOpenProps}/>
    }) : '';

    let style = isRoot ? {} : {borderLeft: '1px dashed black', marginLeft: '-25px'};
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
          name,
          ${ConceptListItem.getFragment('concept')}
        }
      }
    `
  }

});
