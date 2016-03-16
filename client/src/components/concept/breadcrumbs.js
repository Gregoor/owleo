import React from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import fromGlobalID from '../../helpers/from-global-id';

class ConceptBreadcrumbs extends React.Component {

  render() {
    const {concept, showHome, hideLeaf, leafAsLink, leafStyle} = this.props;
    const {id, name, path} = concept;

    let leaf;
    if (!hideLeaf) leaf = leafAsLink ?
      this._renderLink({id, name}, leafStyle, false) :
      <em style={leafStyle}>{name}</em>;

    return (
      <span style={{margin: 0, fontSize: 17}}>
        {showHome ? (
          <span>
            <Link to="/concepts">Home</Link>
            {this._renderArrow()}
          </span>
        ) : ''}
        {path.map(({id, name}) => this._renderLink({id, name}))}
        {leaf}
      </span>
    );
  }

  _renderLink = ({id, name}, style, showArrow = true) => (
    <span key={id} style={{display: 'inline-block'}}>
      <Link to="/concepts" query={{id: fromGlobalID(id)}}
            style={style}>
        {name}
      </Link>
      {showArrow ? this._renderArrow() : ''}
    </span>
  );

  _renderArrow = () => <span style={{padding: 5, color: 'grey'}}>></span>;

}

export default Relay.createContainer(ConceptBreadcrumbs, {

  initialVariables: {id: null},

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        id
        name,
        path {
          id,
          name,
        }
      }
    `
  }

});
