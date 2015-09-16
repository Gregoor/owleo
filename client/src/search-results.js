import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptListItem from './concept-list-item';

class SearchResults extends Component {

  componentWillReceiveProps(props) {
    let {query} = props;
    if (query.length > 2) this.props.relay.forceFetch({query});
  }

  render() {
    let {concepts} = this.props.viewer;
    return (
      <ul>
        {!concepts || concepts.map(concept => (
          <ConceptListItem key={concept.id} {...{concept}} />
        ))}
      </ul>
    );
  }

}

export default Relay.createContainer(SearchResults, {

  initialVariables: {query: null},

  fragments: {
    viewer: () =>  Relay.QL`
      fragment on User {
        concepts(query: $query) {
          ${ConceptListItem.getFragment('concept')}
        }
      }
    `
  }

});
