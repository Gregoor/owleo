import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptListItem from './list-item';

class SearchResults extends Component {

  state = {isTooShort: true};

  componentWillReceiveProps(props) {
    let {query} = props;
    let isTooShort = query.length < 3;
    if (!isTooShort) this.props.relay.forceFetch({query});
    this.setState({isTooShort})
  }

  render() {
    return (
      <div>
        {this.state.isTooShort ?
          this.renderMessage('A search query must be at least 3 characters') :
          this.renderList()
        }
      </div>
    );
  }

  renderMessage(message) {
    return (
      <div style={{padding: '5px', paddingLeft: '10px'}}>
        <em>{message}</em>
      </div>
    );
  }

  renderList() {
    let {viewer, selectedId, onSelect} = this.props;
    let {concepts} = viewer;
    if (!concepts || concepts.length == 0) {
      return this.renderMessage(
        `No concepts with '${this.props.query}' in the title found`
      );
    }
    return (
      <ul>
        {concepts.map(concept => (
          <ConceptListItem key={concept.id} {...{concept, selectedId, onSelect}}/>
        ))}
      </ul>
    );
  }

}

export default Relay.createContainer(SearchResults, {

  initialVariables: {query: null},

  fragments: {
    viewer: () =>  Relay.QL`
      fragment on Viewer {
        concepts(query: $query) {
          ${ConceptListItem.getFragment('concept')}
        }
      }
    `
  }

});
