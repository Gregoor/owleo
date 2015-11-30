import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import pathToUrl from '../../path-to-url';

class ConceptBreadcrumbs extends Component {

  render() {
    return (
      <span style={{margin: 0, fontSize: 16}}>
        {this.props.concept.path.slice(1).reverse().map(concept => (
          <span key={concept.id}>
            <Link to={'/id/' + concept.id}>{concept.name}</Link>
            <span style={{padding: 5, color: 'grey'}}>></span>
          </span>
        ))}
      </span>
    );
  }

}

export default Relay.createContainer(ConceptBreadcrumbs, {

  initialVariables: {id: null},

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        path {
          id,
          name,
        }
      }
    `
  }

});
