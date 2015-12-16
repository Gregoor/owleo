import React from 'react';
import Relay from 'react-relay';

class ConceptSummary extends React.Component {

  render() {
    const {summary, summarySource} = this.props.concept;
    return summarySource ?
      <div>
        <blockquote>
          <p style={{whiteSpace: 'pre-wrap', fontSize: 19, lineHeight: '30px'}}>
            {summary}
          </p>
        </blockquote>
        <em>Source:</em>&nbsp;
        <a href={summarySource}>{summarySource}</a>
      </div> :
      <div style={{whiteSpace: 'pre-wrap'}}>{summary}</div>;
  }

}

export default Relay.createContainer(ConceptSummary, {

  fragments: {
    concept: () => Relay.QL`
      fragment on Concept {
        summary
        summarySource
      }
    `
  }

});
