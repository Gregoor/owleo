import React from 'react';
import Relay from 'react-relay';
import DocumentTitle from 'react-document-title';

import history from '../history';
import LoginMutation from '../mutations/user/login';
import {Button, TextField} from './mdl';

import './checkbox-fix.scss';

class AuthPage extends React.Component {

  state = {
    loginMode: true, authFailed: false, nameInvalid: true, pwInvalid: true
  };

  componentWillMount() {
    this._handleChangeNew = this._handleChangeNew.bind(this);
    this._handleFormChange = this._handleFormChange.bind(this);
    this._handleNameChange = this._handleNameChange.bind(this);
    this._handlePwChange = this._handlePwChange.bind(this);
    this._handleSubmit = this._handleSubmit.bind(this);
  }

  componentDidUpdate() {
    window.componentHandler.upgradeDom();
  }

  render() {
    const {loginMode, authFailed, nameInvalid, pwInvalid} = this.state;
    const {userExists} = this.props.viewer;

    const submitDisabled = (loginMode ? !userExists : userExists) ||
      nameInvalid || pwInvalid || authFailed;

    let userError;
    if (loginMode && !userExists) userError = (
      <div>
        No user found with this name!
        Do you want to <a href="#" onClick={this._handleChangeNew}>register</a>?
      </div>
    );
    else if (!loginMode && userExists) userError = (
      <div>
        This name is already taken.
        Do you want to <a href="#" onClick={this._handleChangeNew}>login</a>?
      </div>
    );

    let errorText;
    if (authFailed) errorText = (
      <div>
        <em style={{color: 'rgb(222, 50, 38)'}}>Authorization failed!</em>
        <br/>
      </div>
    );

    return (
      <DocumentTitle title="Auth">
        <div className="mdl-card mdl-shadow--2dp" style={{margin: '11px auto'}}>
          <div className="mdl-card__title">
            <h2 className="mdl-card__title-text">Authentication</h2>
          </div>
          <form style={{marginBottom: 0}} onSubmit={this._handleSubmit}
                onChange={this._handleFormChange}>
            <div className="mdl-card__supporting-text">
              {errorText}
              <TextField ref="name" label="Username" error={userError}
                         onChange={this._handleNameChange}/>
              <TextField ref="password" label="Password" type="password"
                         onChange={this._handlePwChange}/>
              {loginMode ?
                <div style={{height: 67}}/> :
                <TextField label="Repeat password" type="password"/>
              }
              <label className="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect"
                     htmlFor="is-new">
                <input type="checkbox" id="is-new" checked={!loginMode}
                       className="mdl-checkbox__input"
                       onChange={this._handleChangeNew}/>
                <span className="mdl-checkbox__label">I'm a new user</span>
              </label>
            </div>
            <div className="mdl-card__actions mdl-card--border">
              <Button type="submit" buttonType="accent"
                      disabled={submitDisabled}>
                {loginMode ? 'Login' : 'Register'}
              </Button>
            </div>
          </form>
        </div>
      </DocumentTitle>
    );
  }

  _handleFormChange() {
    this.setState({authFailed: false});
  }

  _handleNameChange(event) {
    const {value} = event.target;

    this.setState({nameInvalid: true});
    if (value) this.props.relay.setVariables({name: value}, (readyState) => {
      if (readyState.done) this.setState({nameInvalid: false});
    });
  }

  _handlePwChange(event) {
    this.setState({pwInvalid: !event.target.value});
  }

  _handleChangeNew(event) {
    const {checked} = event.target;
    if (!checked) event.preventDefault();
    this.setState({loginMode: !(checked || this.state.loginMode)});
  }

  _handleSubmit(event) {
    event.preventDefault();
    const {name, password} = this.refs;
    Relay.Store.update(
      new LoginMutation({
        name: name.getValue(), password: password.getValue()
      }),
      {
        onSuccess: (t) => {
          history.pushState(null, '/');
          location.reload();
        },
        onFailure: (t) => {
          let {errors} = t.getError().source;
          for (let {message} of errors) {
            if (message == 'unauthorized') {
              this.setState({authFailed: true});
            }
          }
        }
      }
    );
  }

}

export default Relay.createContainer(AuthPage, {

  initialVariables: {name: ''},

  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        user {
          name
        }
        userExists(name: $name)
      }
    `
  }

});
