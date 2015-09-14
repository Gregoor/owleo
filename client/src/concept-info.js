import React, {Component} from 'react';
import Relay from 'react-relay';

import {pathToUrl} from './helpers';

class ConceptInfo extends Component {

  render() {
    let {name, summary, reqs} = this.props.concept;

    return (
      <div style={{maxWidth: '600px', margin: '0 auto', border: '1px solid black', padding: '15px'}}>
        <h1 style={{marginTop: 0}}>{name}</h1>
        {this.renderReqs()}
        <p>{summary}</p>
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
        }
      }
    `
  }

});
