import React, {Component} from 'react';
import Relay from 'react-relay';

import CreateExplanationMutation from '../../mutations/explanation/create';
import {TextField, TextArea, Button} from '../mdl';

class ExplanationForm extends Component {

  state = {type: 'text'};

  render() {
    let isLink = this.state.type == 'link';
    return (
      <form key="new" className="mdl-card mdl-shadow--2dp card-auto-fit"
            onSubmit={this._onSubmit.bind(this)}>
        <div className="mdl-card__actions mdl-card--border">
          <div className="mdl-card__supporting-text">
            <label className="mdl-cell mdl-cell--6-col mdl-radio mdl-js-radio
                          mdl-js-ripple-effect">
              <input type="radio" className="mdl-radio__button"
                     name="type" value="text" defaultChecked
                     onChange={this._onChangeType.bind(this)}/>
              <span className="mdl-radio__label">Text</span>
            </label>
            <label className="mdl-cell mdl-cell--6-col mdl-radio mdl-js-radio
                          mdl-js-ripple-effect">
              <input type="radio" className="mdl-radio__button"
                     name="type" value="link"
                     onChange={this._onChangeType.bind(this)}/>
              <span className="mdl-radio__label">Link</span>
            </label>
            <TextArea ref="text" label="Explanation text"
                      outerStyle={{display: isLink ? 'none' : 'block'}}/>
            <TextField ref="link" label="URL" type="url"
                       outerStyle={{
                                    width: '100%',
                                    display: isLink ? 'block' : 'none'
                      }}/>
          </div>
          <Button type="submit" buttonType="primary">
            Add new explanation
          </Button>
        </div>
      </form>
    );
  }

  _onChangeType(event) {
    let {value} = event.target;
    this.setState({type: value});
  }

  _onSubmit(event) {
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
