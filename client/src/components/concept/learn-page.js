import React, {Component} from 'react';
import Relay from 'react-relay';
import _ from 'lodash';

import ConceptFlow from './flow';
import ConceptInfo from './info';
import CardAnimation from '../card-animation';
import {Spinner} from '../mdl';

class ConceptLearnPage extends Component {

  state = {};

  componentWillMount() {
    const [selectedConcept] = this.props.viewer.learnPath;
    this.setState({selectedConcept});
  }

  render() {
    const {viewer} = this.props;
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
          <ConceptFlow concepts={viewer.learnPath} {...{selectedConcept}}
                       onSelect={this._onSelect.bind(this)} />
        </div>

        <div className="mdl-grid" style={{maxWidth: '700px'}}>
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

  _onSelect(conceptId) {
    this.setState({selectedConcept:
      _.find(this.props.viewer.learnPath, ({id}) => id == conceptId)})
  }

}

export default Relay.createContainer(ConceptLearnPage, {

  initialVariables: {targetId: null},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        learnPath(targetId: $targetId) {
          id
          ${ConceptInfo.getFragment('concept')}
          ${ConceptFlow.getFragment('concepts')}
        }
        ${ConceptInfo.getFragment('viewer')}
      }
    `
  }
});
