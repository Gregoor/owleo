import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import pathToUrl from '../../path-to-url';

class ConceptBreadcrumbs extends Component {

  render() {
    let breadcrumbs = [];
    let label;
    if (this.props.concept) {
      let {name, path} = this.props.concept;

      label = name;
      breadcrumbs = path.slice(1).reverse().map(concept => (
        <span key={concept.id}>
        <Link to={'/id/' + concept.id}>{concept.name}</Link>
        <span style={{padding: 5}}>></span>
      </span>
      ));
    } else label = 'No concept selected';

    return (
      <span style={{margin: 0, fontSize: 16}}>
        {breadcrumbs}
        <em>{label}</em>
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
