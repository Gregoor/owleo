import React from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';
import {
  Button, Card, CardActions, CardText, Radio, RadioGroup, Textfield
} from 'react-mdl';
import ReactQuill from 'react-quill';

import CreateExplanationMutation from '../../mutations/explanation/create';

const toolbar = [
  {label: 'Text', type: 'group', items: [
    {type: 'bold', label: 'Bold'},
    {type: 'italic', label: 'Italic'},
    {type: 'underline', label: 'Underline'}
  ]},
  {label: 'Blocks', type: 'group', items: [
    {type: 'bullet', label: 'Bullet'},
    {type: 'separator'},
    {type: 'list', label: 'List'}
  ]},
  {label: 'Image', type: 'image'}
];

class ExplanationForm extends React.Component {

  state = {type: 'text'};

  render() {
    let isLink = this.state.type == 'link';
    return (
      <Card shadow={2}>
        <form onSubmit={this._handleSubmit.bind(this)}>
          <CardText>
            <RadioGroup name="type" value="text"
                        onChange={this._handleChangeType.bind(this)}
                        style={{display: 'flex', justifyContent: 'space-around'}}>
              <Radio ref="textRadio" ripple defaultChecked value="text">
                Text
              </Radio>
              <Radio ref="linkRadio" ripple value="link">Link</Radio>
            </RadioGroup>
            <ReactQuill ref="quill" label="Explanation text" theme="snow"
                        modules={{'image-tooltip': true}}
                        toolbar={toolbar}
                        styles={{
                          '.quill':
                            {width: '100%', display: isLink ? 'none' : 'block'},
                          '.quill-contents': {height: 320}
                        }}/>
            <Textfield ref="link" label="URL" type="url"
                       style={{width: '100%',
                               display: isLink ? 'block' : 'none'}}/>
          </CardText>
          <CardActions className="mdl-card__actions mdl-card--border">
            <Button type="submit" primary>
              Add new explanation
            </Button>
          </CardActions>
        </form>
      </Card>
    );
  }

  _handleChangeType(event) {
    const {value} = event.target;

    const CHECKED_CLASS_NAME = 'is-checked';
    const textNode = ReactDOM.findDOMNode(this.refs.textRadio);
    const linkNode = ReactDOM.findDOMNode(this.refs.linkRadio);

    if (value == 'link') {
      textNode.classList.remove(CHECKED_CLASS_NAME);
      linkNode.classList.add(CHECKED_CLASS_NAME);
    } else {
      linkNode.classList.remove(CHECKED_CLASS_NAME);
      textNode.classList.add(CHECKED_CLASS_NAME);
    }

    this.setState({type: value});
  }

  _handleSubmit(event) {
    event.preventDefault();
    const {type} = this.state;
    const {link, quill} = this.refs;

    const {concept} = this.props;
    const content = type == 'link' ?
      link.refs.input.value : quill.getEditor().getHTML();
    Relay.Store.update(
      new CreateExplanationMutation({concept, type, content}),
      {
        onSuccess: t => {
          location.reload();
        },
        onFailure: t => console.error(t.getError().source.errors)
      }
    );
  }

}

export default Relay.createContainer(ExplanationForm, {

  fragments: {
    concept: () => Relay.QL`
      fragment on Concept {
        ${CreateExplanationMutation.getFragment('concept')}
      }
    `
  }

});
