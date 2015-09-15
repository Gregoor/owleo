import React, {Component} from 'react';
import Relay from 'react-relay';

import {pathToUrl} from './helpers';

let cardStyle = {
  marginBottom: '10px',
  padding: '15px',
  backgroundColor: '#fff',
  boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
};

class ConceptInfo extends Component {

  render() {
    let {name, summary, reqs} = this.props.concept;

    return (
      <div style={{maxWidth: '600px', margin: '0 auto'}}>
        <div style={cardStyle}>
          <h1 style={{marginTop: 0}}>{name}</h1>
          {this.renderReqs()}
          <p>{summary}</p>
        </div>
        {this.renderExplanations()}
      </div>
    );
  }

  renderReqs() {
    let {reqs} = this.props.concept;
    return (
      <div>
        {reqs.length ? <em>Requires:</em> : ''}
        {reqs.map(req => (
          <a key={req.id} href={pathToUrl(req.path)} style={{padding: '5px'}}>
            {req.name}
          </a>
        ))}
      </div>
    );
  }

  renderExplanations() {
    let {explanations} = this.props.concept;
    return explanations.map(explanation => (
      <div key={explanation.id} style={cardStyle}>{explanation.content}</div>
    ));
  }

}

export default Relay.createContainer(ConceptInfo, {

  initialVariables: {id: null},

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        name,
        summary,
        reqs {
          id,
          name,
          path
        },
        explanations {
          id,
          content
        }
      }
    `
  }

});
