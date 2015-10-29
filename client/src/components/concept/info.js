import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import {pathToUrl} from '../../helpers';

class ConceptInfo extends Component {

  render() {
    let {name, summary, reqs} = this.props.concept;
    return (
      <div>
        <div className="mdl-card mdl-shadow--2dp card-auto-fit">
          <div className="mdl-card__title" style={{paddingBottom: 0}}>
            <h2 className="mdl-card__title-text">{name}</h2>
          </div>
          <div className="mdl-card__supporting-text" style={{paddingTop: 5}}>
            {this.renderReqs()}
            <p style={{paddingTop: 10}}>{summary}</p>
          </div>
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
          <Link key={req.id} to={pathToUrl(req.path)} style={{padding: '3px'}}>
            {req.name}
          </Link>
        ))}
      </div>
    );
  }

  renderExplanations() {
    let {explanations} = this.props.concept;
    return explanations.map(explanation => (
      <div key={explanation.id}
           className="mdl-card mdl-shadow--2dp card-auto-fit">
        <div className="mdl-card__supporting-text"
             dangerouslySetInnerHTML={{__html: explanation.content}}/>
      </div>
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
          path {
            name
          }
        },
        explanations {
          id,
          content
        }
      }
    `
  }

});
