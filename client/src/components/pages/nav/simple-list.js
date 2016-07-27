import React from 'react';
import Relay from 'react-relay';

import ConceptSimpleListItem from './simple-list-item';

import './mdl-list.scss';

const ConceptSimpleList = ({relay: {variables: {id}}, viewer: {concept}}) => (
  <div style={{display: 'flex', flexDirection: 'column',
               overflowY: 'hidden'}}>
    <ul className="mdl-list" style={{margin: 0}}>
      {concept.concepts.map((concept) => (
        <ConceptSimpleListItem key={concept.id} selectedID={id} {...{concept}}/>
      ))}
    </ul>
  </div>
);


export default Relay.createContainer(ConceptSimpleList, {

  initialVariables: {id: null},

  fragments: {
    viewer: (vars) =>  Relay.QL`
      fragment on Viewer {
        concept(id: $id, fetchContainerIfEmpty: true, returnEmpty: true) {
          id
          name
          concepts {
            id
            ${ConceptSimpleListItem.getFragment('concept')}
          }
        }
      }
    `
  }

});
