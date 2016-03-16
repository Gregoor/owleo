import React from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';
import {
  Button, Card, CardActions, CardText, Radio, RadioGroup, Textfield
} from 'react-mdl';
import ReactQuill from 'react-quill';
import _ from 'lodash';

import CreateExplanationMutation from '../../mutations/explanation/create';
import UpdateExplanationMutation from '../../mutations/explanation/update';

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

  componentWillMount() {
    const {explanation} = this.props;
    if (explanation) this.setState({type: explanation.type});
  }

  render() {
    const {explanation, hideSwitch} = this.props;
    const defaultContent = explanation ? explanation.content : '';
    const isLink = this.state.type == 'link';
    return (
      <Card shadow={2} style={{marginBottom: 8}}>
        <form onSubmit={this._handleSubmit.bind(this)}>
          <CardText>
            {hideSwitch ? '' :
              <RadioGroup name="type" value="text"
                          style={{display: 'flex', justifyContent: 'space-around'}}>
                <Radio ref="textRadio" ripple defaultChecked value="text"
                       onClick={this._handleChangeType.bind(this)}>
                  Text
                </Radio>
                <Radio ref="linkRadio" ripple value="link"
                       onClick={this._handleChangeType.bind(this)}>
                  Link
                </Radio>
              </RadioGroup>
            }
            <ReactQuill ref="quill" label="Explanation text" theme="snow"
                        modules={{'image-tooltip': true}}
                        toolbar={toolbar}
                        defaultValue={defaultContent}
                        styles={{
                          '.quill':
                            {width: '100%', display: isLink ? 'none' : 'block'},
                          '.quill-contents': {height: 320}
                        }}/>
            <Textfield ref="link" label="URL"
                       defaultValue={defaultContent} style={{width: '100%',
                                          display: isLink ? 'block' : 'none'}}/>
          </CardText>
          <CardActions className="mdl-card__actions mdl-card--border">
            {!explanation ? '' : (
              <Button type="button" onClick={() => this.props.onDone()}>
                Cancel
              </Button>
            )}
            <Button type="submit" primary>
              {explanation ? 'Update explanation' : 'Add new explanation'}
            </Button>
          </CardActions>
        </form>
      </Card>
    );
  }

  _handleChangeType(event) {
    this.setState({type: event.target.value});
  }

  _handleSubmit(event) {
    event.preventDefault();
    const {type} = this.state;
    const {link, quill} = this.refs;

    const {concept, explanation} = this.props;
    const content = type == 'link' ?
      link.refs.input.value : quill.getEditor().getHTML();

    Relay.Store.commitUpdate(
      concept ?
        new CreateExplanationMutation({concept, type, content}) :
        new UpdateExplanationMutation({explanation, type, content})
      ,
      {
        onSuccess: t => {
          concept ? location.reload() : this.props.onDone();
        },
        onFailure: t => console.error(t.getError().source.errors)
      }
    );
  }

}

ExplanationForm.defaultProps = {onDone: _.noop};

export default Relay.createContainer(ExplanationForm, {

  fragments: {

    concept: () => Relay.QL`
      fragment on Concept {
        ${CreateExplanationMutation.getFragment('concept')}
      }
    `,

    explanation: () => Relay.QL`
      fragment on Explanation {
        type
        content
        ${UpdateExplanationMutation.getFragment('explanation')}
      }
    `
  }

});
