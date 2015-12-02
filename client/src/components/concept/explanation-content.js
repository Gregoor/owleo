import React from 'react';
import Relay from 'react-relay';

class ExplanationContent extends React.Component {

  componentDidMount() {
    this._loadIframely();
  }

  componentDidUpdate() {
    this._loadIframely();
  }

  render() {
    let {type, content} = this.props.explanation;

    let explanationContent, style;
    return type == 'link' ?
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <a ref="link" data-iframely-url href={content}>{content}</a>
      </div> :
      <div dangerouslySetInnerHTML={{__html: content}}/>;
  }

  _loadIframely() {
    if (this.props.explanation.type == 'link') {
      window.iframely.load(this.refs.link);
    }
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
