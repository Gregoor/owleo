import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import {pathToUrl} from '../../helpers';

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
      <p style={{margin: 0, padding: '10px 15px', fontSize: 16}}>
        {breadcrumbs}
        <em>{label}</em>
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
        }
      }
    `
  }

});
