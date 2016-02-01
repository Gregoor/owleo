import React from 'react';
import Relay from 'react-relay';
import _ from 'lodash';
import {Icon} from 'react-mdl';

import history from '../../../history';
import fromGlobalID from '../../../helpers/from-global-id';
import ConceptBreadcrumbs from '../../concept/breadcrumbs';
import ConceptFlow from './flow';
import ConceptCard from '../../concept/card/';
import CardAnimation from '../../card-animation';
import {CenteredSpinner, Mastered} from '../../icons';
import createConceptURL from '../../../helpers/create-concept-url';

class ConceptLearnPage extends React.Component {

  state = {};

  componentWillMount() {
    const {id, includeContained} = this.props.location.query;
    this.props.relay.setVariables({
      id, includeContained: includeContained == 'true'
    });
  }

  componentWillReceiveProps({viewer, location}) {
    const {learnPath} = viewer;
    if (learnPath && !location.query.selectedID) this._initSelected(viewer);
  }

  render() {
    const {viewer, location} = this.props;
    const {learnPath, target} = viewer;

    if (!learnPath) return <CenteredSpinner/>;
    const selectedConcept = learnPath
      .find(({id}) => fromGlobalID(id) == location.query.selectedID);

    const masteredAll = learnPath.every(c => c.mastered);
    const {includeContained} = this.props.relay.variables;

    let masteredAllIcon;
    if (masteredAll) {
      masteredAllIcon = includeContained ?
        <Icon name="done_all" className="color-text--valid"/> : <Mastered/>;
    }

    let content;
    if (selectedConcept) content = (
      <ConceptCard key={selectedConcept.id} concept={selectedConcept}
                   nameAsLink showMasterButton {...{viewer}}
                   onMaster={this._handleSelectNext.bind(this)}/>
    );
    const contentLoading = null;

    return (
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
            <ConceptFlow concepts={learnPath} {...{selectedConcept}}
                         onSelect={this._setSelected.bind(this)} />
          </div>

          <div className="card-container concept-scroller">
            <div style={{marginTop: 10}}>
              {contentLoading}
              {content}
            </div>
          </div>

        </div>

      </div>
    );
  }

  _initSelected({learnPath, target}) {
    let i = 0;
    while (i + 1 < learnPath.length && learnPath[i].mastered) i += 1;

    const {includeContained} = this.props.location.query;
    history.replaceState(null, createConceptURL(target, {
      root: 'learn',
      query: {selectedID: fromGlobalID(learnPath[i].id), includeContained}
    }));
  }

  _setSelected(selectedID) {
    const {includeContained} = this.props.location.query;
    history.pushState(null, createConceptURL(this.props.viewer.target, {
      root: 'learn',
      query: {selectedID: fromGlobalID(selectedID), includeContained}
    }))
  }

  _handleSelectNext() {
    const {viewer, location} = this.props;
    const {learnPath} = viewer;
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

  initialVariables: {id: null, includeContained: false},

  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {

        target: concept(id: $id) {
          id
          name
          path { name }
          ${ConceptBreadcrumbs.getFragment('concept')}
        }

        learnPath(targetID: $id, includeContained: $includeContained) {
          id
          name
          mastered
          ${ConceptCard.getFragment('concept')}
          ${ConceptFlow.getFragment('concepts')}
        }

        ${ConceptCard.getFragment('viewer')}
      }
    `
  }
});
