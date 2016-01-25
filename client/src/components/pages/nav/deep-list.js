import React, {PropTypes} from 'react';
import Relay from 'react-relay';
import _ from 'lodash';

import ConceptDeepListItem from './deep-list-item';

const NODE_STYLE = {borderLeft: '1px solid #e7e7e7', marginLeft: '-25px'};

class ConceptDeepList extends React.Component {

  static propTypes = {
    concept: PropTypes.object.isRequired,
    level: PropTypes.number,
    showCreate: PropTypes.bool
  };

  render() {
    const {concept, selectedPath, level} = this.props;
    const {concepts} = concept;

    return (
      <ul style={this.props.level == 0 ? {} : NODE_STYLE}>
        {_.isEmpty(concepts) ? '' : concepts.map(concept => {
          const expanded = !_.isEmpty(selectedPath) && concept.id == selectedPath[level] ?
            true :
            undefined;
          return <ConceptDeepListItem {...this.props} key={concept.id}
                                  concept={concept} expanded={expanded}/>
        })}
      </ul>
    );
  }

}

ConceptDeepList.defaultProps = {
  level: 0
};

export default Relay.createContainer(ConceptDeepList, {

  fragments: {
    concept: () =>  Relay.QL`
      fragment on Concept {
        concepts {
          id
          ${ConceptDeepListItem.getFragment('concept')}
        }
      }
    `
  }

});