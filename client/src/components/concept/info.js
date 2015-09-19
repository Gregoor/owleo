import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';


let cardStyle = {width: 'auto', minHeight: 'auto', marginBottom: '5px'};

class ConceptInfo extends Component {

  render() {
    let {name, summary, reqs} = this.props.concept;

    return (
      <div style={{maxWidth: '512px', margin: '0 auto'}}>
        <div className="mdl-card mdl-shadow--2dp" style={cardStyle}>
          <div className="mdl-card__title">
            <h2 className="mdl-card__title-text">{name}</h2>
          </div>
          <div className="mdl-card__supporting-text">
            {this.renderReqs()}
            <p>{summary}</p>
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
          <Link key={req.id} to={pathToUrl(req.path)}>
            {req.name}
          </Link>
        ))}
      </div>
    );
  }

  renderExplanations() {
    let {explanations} = this.props.concept;
    return explanations.map(explanation => (
      <div className="mdl-card mdl-shadow--2dp" style={cardStyle}>
        <div className="mdl-card__supporting-text">
          {explanation.content}
        </div>
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
