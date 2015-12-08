import React, {Component} from 'react';
import {Link} from 'react-router';
import classnames from 'classnames';

class TextField extends Component {

  componentDidMount() {
    window.componentHandler.upgradeDom();
  }

  render() {
    let {id, label, type = 'text', outerStyle} = this.props;
    return (
      <div className="mdl-textfield mdl-js-textfield
                      mdl-textfield--floating-label" style={outerStyle}>
        <input ref="input" className="mdl-textfield__input"
               {...this.props} {...{type}}/>
        <label className="mdl-textfield__label" htmlFor={id}>{label}</label>
      </div>
    );
  }

  getValue() {
    return this.refs.input.value;
  }

  setValue(value) {
    this.refs.input.value = value;
  }

}

class TextArea extends Component {

  render() {
    let {id, label, outerStyle} = this.props;
    return (
      <div className="mdl-textfield mdl-js-textfield
                    mdl-textfield--floating-label"
           style={{width: '100%', ...outerStyle}}>
        <textarea ref="textarea" className="mdl-textfield__input"
                  {...this.props}/>
        <label className="mdl-textfield__label" htmlFor={id}>{label}</label>
      </div>
    );
  }

  getValue() {
    return this.refs.textarea.value;
  }

}

const BUTTON_PREFIX = 'mdl-button--';
const Button = (props) => {
  let {disabled, buttonType, to} = props;

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

  if (to && !disabled) button = <Link {...{to}}>{button}</Link>;

  return button;
};

const Spinner = ({style = {}}) => (
  <div className="mdl-spinner mdl-js-spinner is-active"
       style={Object.assign({left: '50%', top: '5px'}, style)}/>
);

export {TextField, TextArea, Button, Spinner};
