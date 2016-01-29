import React from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

class ConceptBreadcrumbs extends React.Component {

  render() {
    const {concept, showHome, hideLeaf, leafAsLink, leafStyle} = this.props;
    const {name, path} = concept;

    const reversedPath = path.slice(!hideLeaf && leafAsLink ? 0 : 1).reverse();

    return (
      <span style={{margin: 0, fontSize: 17}}>
        {showHome ? (
          <span>
            <Link to="/concepts">Home</Link>
            {this._renderArrow()}
          </span>
        ) : ''}
        {reversedPath.map((concept, i) => {
          const isLast = (hideLeaf || leafAsLink) && i + 1 == reversedPath.length;
          return (
            <span key={concept.id} style={{display: 'inline-block'}}>
              <Link to="/concepts" query={{id: atob(concept.id).split(':')[1]}}
                    style={!hideLeaf && isLast ? leafStyle : null}>
                {concept.name}
              </Link>
              {isLast ? '' : this._renderArrow()}
          </span>
          )
        })}
        {hideLeaf || leafAsLink ? '' : <em style={leafStyle}>{name}</em>}
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
