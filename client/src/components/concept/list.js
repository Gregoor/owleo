import React, {Component, PropTypes} from 'react';
import Relay from 'react-relay';

import ConceptListItem from './list-item';

class ConceptList extends Component {

  static propTypes = {
    concept: PropTypes.object.isRequired,
    isRoot: PropTypes.bool,
    showCreate: PropTypes.bool
  };

  render() {
    let {openDepth, concept, selectedPath, isRoot} = this.props;
    let {concepts} = concept;

    let topPath;
    let restPath = [];
    if (selectedPath) {
      restPath = selectedPath.slice() ;
      topPath = restPath.shift();
    }
    let subLists = concepts ? concepts.map(concept => {
      let isOpenProps = {};
      if (topPath == concept.name) {
        isOpenProps = {selectedPath: restPath, expanded: true};
      } else if (!selectedPath) {
        isOpenProps = {expanded: openDepth > 0};
      }

      return <ConceptListItem key={concept.id} concept={concept}
                              openDepth={openDepth - 1}
                              {...isOpenProps}/>
    }) : [];

    let style = isRoot ? {} : {borderLeft: '1px solid #e7e7e7', marginLeft: '-25px'};
    return <ul style={style}>{subLists}</ul>;
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
