import React from 'react';
import Relay from 'react-relay';
import _ from 'lodash';
import {Icon, Spinner} from 'react-mdl';

import history from '../../../history';
import fromGlobalID from '../../../helpers/from-global-id';
import ConceptBreadcrumbs from '../../concept/breadcrumbs';
import ConceptFlow from './flow';
import ConceptCard from '../../concept/card/';
import CardAnimation from '../../card-animation';
import {Mastered} from '../../icons';
import createConceptURL from '../../../helpers/create-concept-url';

class ConceptLearnPage extends React.Component {

  state = {};

  componentWillMount() {
    const {id} = this.props.location.query;
    this.props.relay.setVariables({id});
  }

  componentWillReceiveProps({viewer, location}) {
    const {learnPath} = viewer;
    if (learnPath && !location.query.selectedID) this._initSelected(viewer);
  }

  render() {
    const {viewer, location} = this.props;
    const {learnPath, target} = viewer;

    if (!learnPath) return <Spinner/>;
    const selectedConcept = learnPath
      .find(({id}) => fromGlobalID(id) == location.query.selectedID);

    const masteredAll = learnPath.every(c => c.mastered);

    let masteredAllIcon;
    if (masteredAll) masteredAllIcon = <Mastered/>;

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
              <br/>
              <h3 style={{margin: 0}}>
                {target.name} {masteredAllIcon}
              </h3>
              <ConceptBreadcrumbs concept={target}/>
            </div>
            <ConceptFlow concepts={learnPath} {...{selectedConcept}}
                         onSelect={this._handleSelect.bind(this)} />
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

    this._setSelected(target, learnPath[i].id)
  }

  _setSelected(target, selectedID) {
    history.pushState(null, createConceptURL(target, {
      root: 'learn', query: {selectedID}
    }))
  }

  _handleSelect(conceptID) {
    this._setSelected(this.props.viewer.target, conceptID);
  }

  _handleSelectNext() {
    const {viewer, location} = this.props;
    const {learnPath, target} = viewer;
    const index = _.findIndex(learnPath, ({id}) => {
      return fromGlobalID(id) == location.query.selectedID;
    });

    if (index + 1 < learnPath.length) {
      this._setSelected(target, learnPath[index + 1].id);
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
