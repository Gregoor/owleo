import React from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

class ConceptBreadcrumbs extends React.Component {

  render() {
    const {concept, showHome, leafAsLink, leafStyle} = this.props;
    const {name, path} = concept;
    return (
      <span style={{margin: 0, fontSize: 17}}>
        {showHome ? (
          <span>
            <Link to="/concepts">Home</Link>
            {this._renderArrow()}
          </span>
        ) : ''}
        {path.slice(leafAsLink ? 0 : 1).reverse().map((concept, i) => {
          const isLeaf = leafAsLink && i + 1 == path.length;
          return (
            <span key={concept.id} style={{display: 'inline-block'}}>
              <Link to="/concepts" query={{id: atob(concept.id).split(':')[1]}}
                    style={isLeaf ? leafStyle : null}>
                {concept.name}
              </Link>
              {isLeaf ? '' : this._renderArrow()}
          </span>
          )
        })}
        {leafAsLink ? '' : <em style={leafStyle}>{name}</em>}
      </span>
    );
  }

  _renderArrow = () => <span style={{padding: 5, color: 'grey'}}>></span>;

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
