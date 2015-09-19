import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import {shadowStyle, pathToUrl} from './../helpers';

let cardStyle = Object.assign({
  marginTop: '10px',
  padding: '15px',
  backgroundColor: '#fff'
}, shadowStyle);

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
          <Link key={req.id} to={pathToUrl(req.path)} style={{padding: '5px'}}>
            {req.name}
          </Link>
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
