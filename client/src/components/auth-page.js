import React from 'react';
import Relay from 'react-relay';
import DocumentTitle from 'react-document-title';

import history from '../history';
import LoginMutation from '../mutations/user/login';
import {Button, TextField} from './mdl';

import './checkbox-fix.scss';

class AuthPage extends React.Component {

  state = {loginMode: true, authFailed: false};

  componentDidUpdate() {
    window.componentHandler.upgradeDom();
  }

  render() {
    const {loginMode, authFailed} = this.state;

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
          <form onSubmit={this._handleSubmit.bind(this)}
                onChange={this._handleChange.bind(this)}>
            <div className="mdl-card__supporting-text">
              {errorText}
              <TextField ref="name" label="Username"/>
              <TextField ref="password" label="Password" type="password"/>
              <label className="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect"
                     htmlFor="is-new">
                <input type="checkbox" id="is-new" disabled
                       className="mdl-checkbox__input"
                       onChange={this._handleChangeNew.bind(this)}/>
                <span className="mdl-checkbox__label">I'm a new user</span>
              </label>
            </div>
            <div className="mdl-card__actions mdl-card--border">
              <Button type="submit" buttonType="accent" disabled={authFailed}>
              {loginMode ? 'Login' : 'Signup'}
              </Button>
            </div>
          </form>
        </div>
      </DocumentTitle>
    );
  }

  _handleChange() {
    this.setState({authFailed: false});
  }

  _handleChangeNew(event) {
    this.setState({loginMode: !event.target.checked});
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
  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        user {
          name
       }
      }
    `
  }
});
