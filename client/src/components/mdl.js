import React, {Component} from 'react';

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

export default {TextField, TextArea};
