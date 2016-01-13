import React from 'react';
import Relay from 'react-relay';
import _ from 'lodash';
import {Icon} from 'react-mdl';

import ConceptBreadcrumbs from '../../concept/breadcrumbs';
import ConceptFlow from './flow';
import ConceptInfo from '../../concept/info/';
import CardAnimation from '../../card-animation';

class ConceptLearnPage extends React.Component {

  state = {};

  componentWillMount() {
    const {learnPath} = this.props.viewer;
    let i = 0;
    while (i + 1 < learnPath.length && learnPath[i].mastered) i += 1;
    this.setState({selectedConcept: learnPath[i]});
  }

  render() {
    const {viewer} = this.props;
    const {learnPath} = viewer;
    const target = _.last(learnPath);
    const {selectedConcept} = this.state;

    const masteredAll = learnPath.every(c => c.mastered);

    let masteredAllIcon;
    if (masteredAll) masteredAllIcon = (
      <Icon name="done_all" className="accent-color"/>
    ) ;

    let content;
    if (selectedConcept) content = (
      <ConceptInfo key={selectedConcept.id} concept={selectedConcept}
                   nameAsLink={true} includeReqs={false} {...{viewer}}
                   onMaster={this._handleSelectNext.bind(this)}/>
    );
    const contentLoading = null;

    return (
      <div className="concept-nav-container">

        <div className="mdl-card concept-nav" style={{maxWidth: '800px'}}>
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
    );
  }

  _handleSelect(conceptId) {
    this.setState({selectedConcept:
      _.find(this.props.viewer.learnPath, ({id}) => id == conceptId)})
  }

  _handleSelectNext() {
    const {learnPath} = this.props.viewer;
    const {selectedConcept} = this.state;
    const index = _.findIndex(learnPath, ({id}) => id == selectedConcept.id);

    if (index + 1 < learnPath.length) {
      this.setState({selectedConcept: learnPath[index + 1]});
    }
  }

}

export default Relay.createContainer(ConceptLearnPage, {

  initialVariables: {targetId: null},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        learnPath(targetId: $targetId) {
          id
          name
          mastered
          ${ConceptBreadcrumbs.getFragment('concept')}
          ${ConceptInfo.getFragment('concept')}
          ${ConceptFlow.getFragment('concepts')}
        }
        ${ConceptInfo.getFragment('viewer')}
      }
    `
  }
});
