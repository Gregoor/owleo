import React from 'react';
import {Link} from 'react-router';
import classnames from 'classnames';

class TextField extends React.Component {

  componentDidMount() {
    window.componentHandler.upgradeDom();
  }

  render() {
    const {id, label, type = 'text', outerStyle} = this.props;
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

class TextArea extends React.Component {

  render() {
    const {id, label, outerStyle} = this.props;
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
  const {disabled, buttonType, to} = props;

  let buttonTypeClasses = [];
  if (buttonType) buttonTypeClasses =
    (_.isArray(buttonType) ? buttonType : buttonType.split(' '))
      .map(type => BUTTON_PREFIX + type);

  const className = classnames('mdl-button mdl-js-button mdl-js-ripple-effect',
    buttonTypeClasses
  );

  let button = (
    <button type="button" {...props}
            className={className + ' ' + (props.className || '')}>
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
