import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

class ConceptBreadcrumbs extends Component {

  render() {
    let {name, path} = this.props.concept;
    return (
      <span style={{margin: 0, fontSize: 17}}>
        {path.slice(1).reverse().map(concept => (
          <span key={concept.id}>
            <Link to="/concepts" query={{id: atob(concept.id).split(':')[1]}}>
              {concept.name}
            </Link>
            <span style={{padding: 5, color: 'grey'}}>></span>
          </span>
        ))}
        {<em>{name}</em>}
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
