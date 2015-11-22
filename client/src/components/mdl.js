import React, {Component} from 'react';
import {Link} from 'react-router';
import classnames from 'classnames';

class TextField extends Component {

  componentDidMount() {
    window.componentHandler.upgradeDom();
  }

  render() {
    let {id, label, onChange, type = 'text'} = this.props;
    return (
      <div className="mdl-textfield mdl-js-textfield
                      mdl-textfield--floating-label">
        <input ref="input" className="mdl-textfield__input"
               {...{id, type, onChange}}/>
        <label className="mdl-textfield__label" htmlFor={id}>{label}</label>
      </div>
    );
  }

  getValue() {
    return this.refs.input.value;
  }

}

class TextArea extends Component {

  render() {
    let {id, label, rows} = this.props;
    return (
      <div className="mdl-textfield mdl-js-textfield
                    mdl-textfield--floating-label">
        <textarea ref="textarea" className="mdl-textfield__input"
                  {...{id, rows}}/>
        <label className="mdl-textfield__label" htmlFor={id}>{label}</label>
      </div>
    );
  }

  getValue() {
    return this.refs.textarea.value;
  }

}

const BUTTON_PREFIX = 'mdl-button--';
let Button = (props) => {
  let {buttonType, to} = props;

  let buttonTypeClasses = [];
  if (buttonType) {
    buttonTypeClasses = _.isArray(buttonType) ?
      buttonType.map(type => BUTTON_PREFIX + type) : BUTTON_PREFIX + buttonType;
  }
  let className = classnames('mdl-button mdl-js-button mdl-js-ripple-effect',
    buttonTypeClasses
  );

  let button = (
    <button className={className} type="button" {...props}>
      {props.children}
    </button>
  );

  if (to) button = <Link {...{to}}>{button}</Link>;

  return button;
};

export default {TextField, TextArea, Button};
