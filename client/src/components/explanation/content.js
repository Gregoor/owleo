import React from 'react';
import Relay from 'react-relay';

const ExplanationContent = ({explanation: {type, content}}) => (
  type == 'link' ?
    <div className="explanation" style={{marginLeft: 8}}>
      <a href={content} className="embedly-card"
         data-card-controls="0" data-card-chrome="0"
         style={{wordWrap: 'break-word'}}>
        {content.length > 50 ? shortenURL(content) : content}
      </a>
    </div> :
    <div dangerouslySetInnerHTML={{__html: content}}
         style={{margin: 8}}/>
);

export default Relay.createContainer(ExplanationContent, {
  
  fragments: {
    explanation: () => Relay.QL`
      fragment on Explanation {
        type
        content
      }
    `
  }
  
})
