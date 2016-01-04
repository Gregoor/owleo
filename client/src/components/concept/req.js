import React from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';
import clamp from 'clamp-js';

import createConceptURL from '../../helpers/create-concept-url';
import MasterConceptButton from './master-button';

class Req extends React.Component {

  componentDidMount() {
    this.clampSummary();
  }

  componentDidUpdate() {
    this.clampSummary();
  }

  render() {
    const {concept, isLast} = this.props;
    const {name, summary, mastered} = concept;

    const borderStyle = '1px solid rgba(0, 0, 0, 0.1)';
    return (
      <div className="mdl-card__supporting-text"
           style={{borderTop: borderStyle,
                   backgroundColor: mastered ? 'rgb(246, 247, 255)' : 'white',
                   borderBottom: isLast ? borderStyle : 'none'}}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <h3 style={{fontSize: 22, margin: 0}}>
            <Link to={createConceptURL(concept)}>{name}</Link>
          </h3>
          <MasterConceptButton concept={concept}/>
        </div>
        {mastered ? '' :
          <div ref="summary" style={{whiteSpace: 'pre-wrap'}}>{summary}</div>
        }
      </div>
    );
  }

  clampSummary() {
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
