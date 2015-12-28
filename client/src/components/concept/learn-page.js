import React, {Component} from 'react';
import Relay from 'react-relay';
import _ from 'lodash';

import ConceptFlow from './flow';
import ConceptInfo from './info';
import CardAnimation from '../card-animation';
import {Button, Spinner} from '../mdl';

class ConceptLearnPage extends Component {

  state = {};

  componentWillMount() {
    const [selectedConcept] = this.props.viewer.learnPath;
    this.setState({selectedConcept});
  }

  render() {
    const {viewer} = this.props;
    const {learnPath} = viewer;
    const target = _.last(learnPath);
    const {selectedConcept} = this.state;

    let content;
    if (selectedConcept) content = (
      <ConceptInfo key={selectedConcept.id} concept={selectedConcept}
                   includeReqs={false} {...{viewer}}/>
    );
    const contentLoading = null;

    return (
      <div className="concept-nav-container">

        <div className="mdl-card concept-nav" style={{maxWidth: '800px'}}>
          <div style={{padding: 5, borderBottom: '1px solid black'}}>
            You are mastering <br/>
            <h3 style={{margin: 0}}>{target.name}</h3>
            <span style={{fontSize: 13}}>
              {_(target.path.slice())
                .map(({name}) => name).dropRight().reverse()
              .join(' > ')}
            </span>
          </div>
          <ConceptFlow concepts={learnPath} {...{selectedConcept}}
                       onSelect={this._onSelect.bind(this)} />
        </div>

        <div className="mdl-grid" style={{maxWidth: '700px'}}>
          <div className="card-container concept-scroller">
            <div>
              {contentLoading}
              {content}
            </div>
          </div>
        </div>

        <span style={{position: 'fixed', right: 30, bottom: 30, zIndex: 1}}
              title="Got it, show me the next concept!">
          <Button buttonType="fab colored" onClick={this._onSelectNext.bind(this)}>
            <i className="material-icons">check</i>
          </Button>
        </span>

      </div>
    );
  }

  _onSelect(conceptId) {
    this.setState({selectedConcept:
      _.find(this.props.viewer.learnPath, ({id}) => id == conceptId)})
  }

  _onSelectNext() {
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
          path { name }
          ${ConceptInfo.getFragment('concept')}
          ${ConceptFlow.getFragment('concepts')}
        }
        ${ConceptInfo.getFragment('viewer')}
      }
    `
  }
});
