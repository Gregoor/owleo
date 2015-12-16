import React from 'react';
import Relay from 'react-relay';

import ConceptSummary from './summary';
import ExplanationContent from '../explanation/content';
import {Button} from '../mdl';


class ConceptCard extends React.Component {

  state = {activeExplanation: 0};

  render() {
    let {concept} = this.props;

    if (!concept) return null;

    let {name, summary, explanations} = concept;
    let {activeExplanation} = this.state;

    let explanationsCount = explanations.edges.length;
    let explanationPanel;
    if (explanationsCount) {
      let explanation = explanations.edges[activeExplanation].node;
      let {id, type} = explanation;

      explanationPanel = (
        <div>
          <div className="mdl-card__supporting-text"
               style={{borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                       padding: type == 'link' ? 0 : 16}}>
            <ExplanationContent key={id} explanation={explanation}/>
          </div>
          <div className="mdl-card__actions mdl-card--border"
               style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Button disabled={activeExplanation == 0} style={{width: 100}}
                    onClick={() => this.setState({activeExplanation: activeExplanation - 1})}>
              Previous
            </Button>
            <span>Explanation {activeExplanation + 1} of {explanationsCount}</span>
            <Button disabled={activeExplanation + 1 == explanationsCount}
                    style={{width: 100}}
                    onClick={() => this.setState({activeExplanation: activeExplanation + 1})}>
              Next
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mdl-card mdl-cell mdl-cell--12-col">
        <div className="mdl-card__title">
          <h2 className="mdl-card__title-text">{name}</h2>
        </div>
        <div className="mdl-card__supporting-text" style={{whiteSpace: 'pre-wrap'}}>
          <ConceptSummary concept={concept}/>
        </div>
        {explanationPanel}
      </div>
    );
  }

}

export default Relay.createContainer(ConceptCard, {

  initialVariables: {sid: null},

  fragments: {
    concept: () => Relay.QL`
      fragment on Concept {
        name
        ${ConceptSummary.getFragment('concept')}
        path {name}
        explanations(first: 10) {
          edges {
            node {
              id
              type
              ${ExplanationContent.getFragment('explanation')}
            }
          }
        }
        explanationsCount
      }
    `
  }

});
