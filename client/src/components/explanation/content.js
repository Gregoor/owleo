import React from 'react';
import Relay from 'react-relay';
import '../../../lib/embedly';

import {Spinner} from '../mdl';

import shortenURL from '../../helpers/shorten-url';

class ExplanationContent extends React.Component {

  render() {
    const {type, content} = this.props.explanation;

    let explanationContent, style;
    return type == 'link' ?
      <div className="explanation">
        <a href={content} className="embedly-card" data-card-controls="0"
           data-card-chrome="0">
          {content.length > 50 ? shortenURL(content) : content}
        </a>
      </div> :
      <div dangerouslySetInnerHTML={{__html: content}}/>;
  }

}

export default Relay.createContainer(ExplanationContent, {

  fragments: {
    explanation: () => Relay.QL`
      fragment on Explanation {
        content
        type
      }
    `
  }

})
