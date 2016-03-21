import React from 'react';
import Relay from 'react-relay';

import fromGlobalID from '../../../helpers/from-global-id';
import ConceptBreadcrumbs from '../../concept/breadcrumbs';
import ConceptSimpleListItem from './simple-list-item';

import './mdl-list.scss';

const ConceptSimpleList = ({relay: {variables: {id}}, viewer: {concept}}) => (
  <div style={{display: 'flex', flexDirection: 'column', height: '86.5vh',
               overflowY: 'hidden', marginTop: concept.name ? 0 : -40}}>
    <div style={{minHeight: 20, padding: 10}}>
      {concept.name ?
        <ConceptBreadcrumbs concept={concept} showHome
                            leafAsLink
                            leafStyle={{fontWeight: fromGlobalID(concept.id) == id ? 800 : 500}}/>
        : ''}
    </div>
    <ul className="mdl-list"
        style={{height: '100%', margin: 0, overflowY: 'auto'}}>
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
          ${ConceptBreadcrumbs.getFragment('concept').if(vars.id)}
        }
      }
    `
  }

});
