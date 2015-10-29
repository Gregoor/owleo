import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import {pathToUrl} from '../../helpers';

class ConceptBreadcrumbs extends Component {

  render() {
    let {name, path} = this.props.concept;

    let breadcrumbs = path.slice(1).reverse().map(concept => (
      <span key={concept.id}>
        <Link to={pathToUrl(concept.path)}>{concept.name}</Link>
        <span style={{padding: 5}}>></span>
      </span>
    ));

    return (
      <p style={{margin: 0, padding: 15, fontSize: 16}}>
        {breadcrumbs}
        <em>{name}</em>
      </p>
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
          path {
            name
          }
        }
      }
    `
  }

});
