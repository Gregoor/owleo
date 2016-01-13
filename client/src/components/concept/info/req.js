import React from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';
import clamp from 'clamp-js';

import createConceptURL from '../../../helpers/create-concept-url';
import MasterConceptButton from './master-button';

class Req extends React.Component {

  componentDidMount() {
    this._clampSummary();
  }

  componentDidUpdate() {
    this._clampSummary();
  }

  render() {
    const {concept, isLast} = this.props;
    const {name, summary, mastered} = concept;

    const borderStyle = '1px solid rgba(0, 0, 0, 0.1)';
    return (
      <div className="mdl-card__supporting-text"
           style={{borderTop: borderStyle, overflow: 'hidden',
                   borderBottom: isLast ? borderStyle : 'none',
                   height: mastered ? 40 : 96,
                   transition: 'height 300ms ease-in-out'}}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <h3 style={{fontSize: 22, margin: 0}}>
            <Link to={createConceptURL(concept)}>{name}</Link>
          </h3>
          <MasterConceptButton concept={concept} mini style={{margin: '0 10'}}/>
        </div>
        <div ref="summary" style={{whiteSpace: 'pre-wrap',
                                   opacity: mastered ? 0 : 1,
                                   transition: 'opacity 300ms linear'}}>
          {summary}
        </div>
      </div>
    );
  }

  _clampSummary() {
    if (!this.props.concept.mastered) clamp(this.refs.summary, {clamp: 2});
  }

}

export default Relay.createContainer(Req, {

  fragments: {
    concept: (variables) => Relay.QL`
      fragment on Concept {
        id
        name
        summary
        mastered
        path {
          name
        }
        ${MasterConceptButton.getFragment('concept')}
      }
    `
  }

});
