import React from 'react';
import Relay from 'react-relay';
import DocumentTitle from 'react-document-title';
import {
  Button, Card, CardActions, CardText, CardTitle, Checkbox, ProgressBar,
  Spinner, Textfield
} from 'react-mdl';
import _ from 'lodash';
import pluralize from 'pluralize';

import history from '../history';
import LoginMutation from '../mutations/user/login';
import {Check, Cross} from './icons';

class AuthPage extends React.Component {

  state = {
    loginMode: true, isAuthenticating: false, authFailed: false,
    nameEmpty: true, isCheckingName: false, pwEmpty: true, pwRepeatEmpty: true,
    pwMismatch: undefined
  };

  componentWillMount() {
    this._handleChangeNew = this._handleChangeNew.bind(this);
    this._handleFormChange = this._handleFormChange.bind(this);
    this._handleNameChange = this._handleNameChange.bind(this);
    this._handlePwChange = this._handlePwChange.bind(this);
    this._handlePwRepeatChange = this._handlePwRepeatChange.bind(this);
    this._handlePwRepeatBlur = this._handlePwRepeatBlur.bind(this);
    this._handleSubmit = this._handleSubmit.bind(this);
  }

  render() {
    const {
      loginMode, isAuthenticating, authFailed, isCheckingName, nameEmpty,
      pwEmpty, pwRepeatEmpty, pwMismatch
    } = this.state;
    const {user, userExists} = this.props.viewer;

    const isValidName = loginMode ? userExists : !userExists;

    const submitDisabled = !loginMode && (pwRepeatEmpty || pwMismatch) ||
      !isValidName || isAuthenticating || isCheckingName || pwEmpty ||
      authFailed;

    let nameError;
    if (!nameEmpty && !isCheckingName) {
      if (loginMode && !userExists) nameError = (
        <div>
          No user found with this name!
          Did you want to&nbsp;
          <a href="#" onClick={this._handleChangeNew} className="primary-color">
            register
          </a>?
        </div>
      );
      else if (!loginMode && userExists) nameError = (
        <div>
          This name is already taken.
          Did you want to&nbsp;
          <a href="#" onClick={this._handleChangeNew} className="primary-color">
            login
          </a>?
        </div>
      );
    }

    let pwError;
    if (authFailed) {
      pwError = `That's not your password, ${this.refs.name.refs.input.value}!`
    }

    let pwRepeatError;
    if (pwMismatch) {
      pwRepeatError = 'Must be identical to password!';
    }

    return (
      <DocumentTitle title="Auth">
        <form style={{margin: '11px auto', maxWidth: 360}}
              onSubmit={this._handleSubmit} onChange={this._handleFormChange}>
          <Card shadow={2}>
            <CardTitle>Authentication</CardTitle>
            <CardText>
              {user.isGuest ? '' :
                `You're currently logged in as ${user.name}.`
              }
              <Textfield ref="name" label="Username" floatingLabel
                         error={nameError} onChange={this._handleNameChange}
                         style={{marginBottom: 10}}/>
              {nameEmpty ? '' :
                (isCheckingName ?
                  <Spinner/> :
                  (isValidName ? <Check key="check"/> : <Cross key="cross"/>))
              }
              <Checkbox label="I'm a new user" ripple checked={!loginMode}
                        onChange={this._handleChangeNew}/>
              <Textfield ref="password" label="Password" floatingLabel
                         type="password" error={pwError}
                         onChange={this._handlePwChange}/>
              {authFailed ? <Cross/> : (!loginMode && !pwEmpty ? <Check/> : '')}
              {loginMode ?
                <div style={{height: 67}}/> :
                <div>
                  <Textfield ref="passwordRepeat" type="password"
                             label="Repeat password" floatingLabel
                             onChange={this._handlePwRepeatChange}
                             onBlur={this._handlePwRepeatBlur}
                             error={pwRepeatError}/>
                  {pwRepeatEmpty || pwMismatch === undefined ? '' :
                    (pwMismatch ? <Cross/> : <Check/>)}
                </div>
              }
            </CardText>
            <CardActions>
              <Button type="submit" ripple accent disabled={submitDisabled}>
                {loginMode ? 'Login' : 'Register'}
              </Button>
              {isAuthenticating ?
                <ProgressBar indeterminate style={{width: '100%'}}/> :
                ''
              }
            </CardActions>
          </Card>
          {user.isGuest && user.masteredConceptsCount ? (
            <Card style={{marginTop: 10}}>
              <CardText>
                Registering will save the&nbsp;
                {pluralize('concept', user.masteredConceptsCount, true)}&nbsp;
                you already learned.
              </CardText>
            </Card>
          ) : ''}
        </form>
      </DocumentTitle>
    );
  }

  _handleFormChange() {
    this.setState({authFailed: false});
  }

  _handleNameChange(event) {
    const {value} = event.target;

    this.setState({isCheckingName: true, nameEmpty: !value});
    if (value) this._checkName(value);
  }

  _checkName = _.debounce((name) => {
    this.props.relay.setVariables({name}, (readyState) => {
      if (readyState.done) this.setState({isCheckingName: false});
    });
  }, 300);

  _handlePwChange(event) {
    this.setState({pwEmpty: !event.target.value});
  }

  _handlePwRepeatChange(event) {
    const {value} = event.target;
    this.setState({pwRepeatEmpty: !value});
    this.setState({pwMismatch: undefined});
  }

  _handlePwRepeatBlur() {
    const {password, passwordRepeat} = this.refs;
    this.setState({
      pwMismatch: passwordRepeat.refs.input.value != password.refs.input.value
    });
  }

  _handleChangeNew(event) {
    const {checked} = event.target;
    if (checked === undefined) event.preventDefault();
    this.setState({
      loginMode: !(checked || this.state.loginMode),
      authFailed: false, pwRepeatEmpty: true, pwMismatch: undefined
    });
  }

  _handleSubmit(event) {
    event.preventDefault();
    const {name, password} = this.refs;
    this.setState({isAuthenticating: true});
    Relay.Store.update(
      new LoginMutation({
        name: name.refs.input.value, password: password.refs.input.value
      }),
      {
        onSuccess: (t) => {
          history.pushState(null, '/');
          location.reload();
        },
        onFailure: (t) => {
          for (const {message} of t.getError().source.errors) {
            if (message == 'unauthorized') {
              this.setState({isAuthenticating: false, authFailed: true});
              break;
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
          isGuest
          masteredConceptsCount
        }
        userExists(name: $name)
      }
    `
  }

});
