import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import pathToUrl from '../../path-to-url';

class ConceptBreadcrumbs extends Component {

  render() {
    let {name, path} = this.props.concept;
    return (
      <span style={{margin: 0, fontSize: 16}}>
        {path.slice(1).reverse().map(concept => (
          <span key={concept.id}>
            <Link to={'/id/' + concept.id}>{concept.name}</Link>
            <span style={{padding: 5, color: 'grey'}}>></span>
          </span>
        ))}
        {path.length > 1 ? <em>{name}</em> : ''}
      </span>
    );
  }

}

export default Relay.createContainer(ConceptBreadcrumbs, {

  initialVariables: {id: null},

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        name,
        path {
          id,
          name,
        }
      }
    `
  }

});
