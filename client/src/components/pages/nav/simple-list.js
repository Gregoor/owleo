import React, {PropTypes} from 'react';
import Relay from 'react-relay';
import {Spinner} from 'react-mdl';

import fromGlobalID from '../../../helpers/from-global-id';
import ConceptBreadcrumbs from '../../concept/breadcrumbs';
import ConceptSimpleListItem from './simple-list-item';

import './mdl-list.scss';

class ConceptSimpleList extends React.Component {

  static propTypes = {
    viewer: PropTypes.object.isRequired,
    selectedID: PropTypes.string
  };

  state = {showSpinner: true, isLoading: true};

  componentWillMount() {
    this._fetchConcept(this.props);
  }

  componentWillReceiveProps(props) {
    this._fetchConcept(props);
  }

  render() {
    const {viewer, selectedID} = this.props;
    const {concept} = viewer;
    const {showSpinner, isLoading} = this.state;

    if (showSpinner && isLoading || !concept) return (
      <div style={{marginLeft: '50%', marginTop: 5, overflow: 'hidden'}}>
        <Spinner/>
      </div>
    );

    const {concepts} = concept;

    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '86.5vh',
                   overflowY: 'hidden'}}>
          <div style={{minHeight: 20, padding: 10}}>
          {concept.name ?
            <ConceptBreadcrumbs concept={concept} showHome
                                leafAsLink
                                leafStyle={{fontWeight: concept.id == selectedID ? 800 : 500}}/>
          : ''}
        </div>
        <ul className="mdl-list"
            style={{height: '100%', margin: 0, overflowY: 'auto'}}>
          {concepts.map((concept) => (
            <ConceptSimpleListItem key={concept.id} {...{concept, selectedID}}/>
          ))}
        </ul>
      </div>
    );
  }

  _fetchConcept({selectedID}) {
    this.setState({isLoading: true});
    this.props.relay.setVariables(
      {id: selectedID ? fromGlobalID(selectedID) : null, returnEmpty: !selectedID},
      (readyState) => {
        if (readyState.done) {
          this.setState({isLoading: false});
          setTimeout(() => this.setState({showSpinner: true}), 300);
        }
      });
  }

}


export default Relay.createContainer(ConceptSimpleList, {

  initialVariables: {id: null, returnEmpty: false},

  fragments: {
    viewer: () =>  Relay.QL`
      fragment on Viewer {
        concept(id: $id, fetchContainerIfEmpty: true, returnEmpty: $returnEmpty) {
          id
          name
          concepts {
            id
            ${ConceptSimpleListItem.getFragment('concept')}
          }
          ${ConceptBreadcrumbs.getFragment('concept')}
        }
      }
    `
  }

});
