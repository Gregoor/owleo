import React, {PropTypes} from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import _ from 'lodash';
import {Spinner} from 'react-mdl';

import createConceptURL from '../../../helpers/create-concept-url';
import ConceptBreadcrumbs from '../../concept/breadcrumbs';
import MasterConceptButton from '../../concept/info/master-button';

import './mdl-list.scss';

class ConceptSimpleList extends React.Component {

  static propTypes = {
    viewer: PropTypes.object.isRequired,
    selectedId: PropTypes.string
  };

  state = {showSpinner: true, isLoading: true};

  componentWillMount() {
    this._fetchConcept(this.props);
  }

  componentWillReceiveProps(props) {
    this._fetchConcept(props);
  }

  render() {
    const {viewer, selectedId} = this.props;
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
            <ConceptBreadcrumbs concept={concept} showHome leafAsLink
                                leafStyle={{fontWeight: concept.id == selectedId ? 800 : 500}}/>
          : ''}
        </div>
        <ul className="mdl-list"
            style={{width: '100%', height: '100%', margin: 0,
                    overflowY: 'auto'}}>
          {concepts.map((c) => (
            <li key={c.id} className="mdl-list__item">
              <span className="mdl-list__item-primary-content">
                <span style={{display: 'inline-block', width: 30, height: 30,
                              textAlign: 'center', verticalAlign: 'middle',
                              borderStyle: 'solid',
                              borderWidth: selectedId == c.id ? 3 : 2,
                              borderColor: selectedId == c.id ? '#FF4081' : 'rgba(0, 0, 0, .2)',
                              marginRight: 5, borderRadius: 100}}>
                  <span style={{display: 'inline-block', marginTop: 3}}>
                    {c.conceptsCount || ''}
                  </span>
                </span>
                <Link to={createConceptURL(c)}
                      onClick={this._maybeDontShowSpinner.bind(this, c.conceptsCount)}
                      style={{fontSize: 17,
                              fontWeight: selectedId == c.id ? 800 : 500}}>
                  {c.name}
                </Link>
              </span>
              <a className="mdl-list__item-secondary-action" href="#">
                <MasterConceptButton concept={c} mini raised={false}/>
              </a>
            </li>

          ))}
        </ul>
      </div>
    );
  }

  _fetchConcept({selectedId}) {
    this.setState({isLoading: true});
    this.props.relay.setVariables(
      {id: selectedId ? atob(selectedId).split(':')[1] : ''},
      (readyState) => {
        if (readyState.done) {
          this.setState({isLoading: false});
          setTimeout(() => this.setState({showSpinner: true}), 300);
        }
      });
  }

  _maybeDontShowSpinner(conceptsCount) {
    this.setState({showSpinner: conceptsCount > 0});
  }

}


export default Relay.createContainer(ConceptSimpleList, {

  initialVariables: {id: null},

  fragments: {
    viewer: () =>  Relay.QL`
      fragment on Viewer {
        concept(id: $id, fetchContainerIfEmpty: true) {
          id
          name
          concepts {
            id
            name
            path { name }
            conceptsCount
            ${MasterConceptButton.getFragment('concept')}
          }
          ${ConceptBreadcrumbs.getFragment('concept')}
        }
      }
    `
  }

});
