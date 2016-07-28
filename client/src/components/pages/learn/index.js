import React from 'react';
import Relay from 'react-relay';
import _ from 'lodash';
import {Icon} from 'react-mdl';

import history from '../../../history';
import fromGlobalID from '../../../helpers/from-global-id';
import ConceptBreadcrumbs from '../../concept/breadcrumbs';
import ConceptFlow from './flow';
import ConceptCard from '../../concept/card/';
import {CenteredSpinner, Mastered} from '../../icons';
import createConceptURL from '../../../helpers/create-concept-url';

class ConceptLearnPage extends React.Component {

  state = {};

  componentWillMount() {
    const {id, includeContained, selectedID} = this.props.location.query;
    this.props.relay.setVariables({
      id, selectedID, includeContained: includeContained == 'true'
    });
  }

  componentWillReceiveProps({viewer: {target}, location}) {
    if (!this._selecting && target && !location.query.selectedID) {
      this._initSelected(target);
    }
  }

  render() {
    const {viewer, location: {query: {selectedID}}} = this.props;
    const {target, selected} = viewer;

    if (!target || !selected) return <CenteredSpinner style={{marginTop: 10}}/>;

    const {learnPath} = target;
    const masteredAll = learnPath.every(c => c.mastered);
    const {includeContained} = this.props.relay.variables;

    let masteredAllIcon;
    if (masteredAll) {
      masteredAllIcon = includeContained ?
        <Icon name="done_all" className="color-text--valid"/> : <Mastered/>;
    }

    return (
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <div style={{width: 700}}>

          <div style={{margin: 10, minHeight: 28}}>
            <ConceptBreadcrumbs concept={selected} showHome/>
          </div>

          <div className="concept-nav-container">

            <div className="nav-negative-margin">

              <div className="mdl-card concept-nav">
                <div style={{padding: 5, borderBottom: '1px solid black'}}>
                  {masteredAll ? 'You have mastered' : 'You are mastering'}
                  {includeContained ? ' every concept in' : ''}
                  <br/>
                  <h3 style={{margin: 0}}>
                    {target.name} {masteredAllIcon}
                  </h3>
                  <ConceptBreadcrumbs concept={target}/>
                </div>
                <ConceptFlow concepts={learnPath} selectedID={selectedID}
                             onSelect={this._setSelected.bind(this)} style={{height: '500px'}} />
              </div>

              <div className="card-container concept-scroller">
                {selected.id != selectedID ?
                  <ConceptCard key={selected.id} concept={selected}
                               nameAsLink showMasterButton {...{viewer}}
                               onMaster={this._handleSelectNext.bind(this)}/> :
                  <CenteredSpinner/>
                }
              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  _initSelected(target) {
    const {learnPath} = target;
    let i = 0;
    while (i + 1 < learnPath.length && learnPath[i].mastered) i += 1;

    const {includeContained} = this.props.location.query;
    const selectedID = fromGlobalID(learnPath[i].id);

    this._selecting = true;
    history.replaceState(null, createConceptURL(target, {
      root: 'learn',
      query: {selectedID, includeContained}
    }));
    this.props.relay.setVariables({selectedID});
  }

  _setSelected(selectedID) {
    const {includeContained} = this.props.location.query;
    selectedID = fromGlobalID(selectedID);
    this.props.relay.setVariables({selectedID});
    history.pushState(null, createConceptURL(this.props.viewer.target, {
      root: 'learn', query: {selectedID, includeContained}
    }))
  }

  _handleSelectNext() {
    const {viewer, location} = this.props;
    const {learnPath} = viewer.target;
    const {selectedID} = location.query;
    let index = _.findIndex(learnPath, ({id}) => fromGlobalID(id) == selectedID);

    do {
      index++;
    } while (index < learnPath.length && learnPath[index].mastered);

    if (index < learnPath.length) {
      this._setSelected(learnPath[index].id);
    } else {
      const unmasteredConcept = learnPath.find(({id, mastered}) => {
        return !mastered && fromGlobalID(id) !== selectedID;
      });
      if (unmasteredConcept) this._setSelected(unmasteredConcept.id);
      else this._setSelected(this.props.viewer.target.id);
    }
  }

}

export default Relay.createContainer(ConceptLearnPage, {

  initialVariables: {id: null, selectedID: null, includeContained: false},

  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {

        target: concept(id: $id) {
          id
          name
          path { name }
          ${ConceptBreadcrumbs.getFragment('concept')}
          learnPath(includeContained: $includeContained) {
            id
            name
            mastered
            ${ConceptFlow.getFragment('concepts')}
          }
        }
        
        selected: concept(id: $selectedID) {
          id
          ${ConceptBreadcrumbs.getFragment('concept')}
          ${ConceptCard.getFragment('concept')}
        }

        ${ConceptCard.getFragment('viewer')}
      }
    `
  }
});
