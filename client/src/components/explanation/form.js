import React from 'react';
import Relay from 'react-relay';
import {
  Button, Card, CardActions, CardText, Radio, RadioGroup, Textfield
} from 'react-mdl';

import CreateExplanationMutation from '../../mutations/explanation/create';

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
                <Radio ripple defaultChecked value="text">Text</Radio>
                <Radio ripple value="link">Link</Radio>
            </RadioGroup>
            <Textfield ref="text" label="Explanation text" rows={3}
                       style={{width: '100%', display: isLink ? 'none' : 'block'}}/>
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
    let {value} = event.target;
    this.setState({type: value});
  }

  _handleSubmit(event) {
    event.preventDefault();
    let {type} = this.state;
    let {link, text} = this.refs;

    let {concept} = this.props;
    Relay.Store.update(
      new CreateExplanationMutation({
        concept, type, content: (type == 'link' ? link : text).getValue()
      }),
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
