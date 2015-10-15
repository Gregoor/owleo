import React, {Component} from 'react';
import Relay from 'react-relay';

import LoginMutation from '../mutations/login-mutation';
import {TextField} from './mdl';

import './checkbox-fix.scss';

class AuthPage extends Component {

  state = {loginMode: true};

  componentDidUpdate() {
    window.componentHandler.upgradeDom();
  }

  render() {
    let {loginMode} = this.state;
    return (
      <div className="mdl-card mdl-shadow--2dp" style={{margin: '5px auto'}}>
        <div className="mdl-card__title">
          <h2 className="mdl-card__title-text">Authentication</h2>
        </div>
        <form onSubmit={this.onSubmit.bind(this)}>
          <div className="mdl-card__supporting-text">

            <TextField id="name" label="Username"/>
            <TextField id="name" label="Password" type="password"/>
            <label className="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect"
                   htmlFor="is-new">
              <input type="checkbox" id="is-new"
                     className="mdl-checkbox__input"
                     onChange={this.onChangeNew.bind(this)}/>
              <span className="mdl-checkbox__label">I'm a new user</span>
            </label>
          </div>
          <div className="mdl-card__actions mdl-card--border">
            <button type="submit" className="mdl-button mdl-button--colored
                                    mdl-js-button mdl-js-ripple-effect">
            {loginMode ? 'Login' : 'Signup'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  onChangeNew(event) {
    this.setState({loginMode: !event.target.checked});
  }

  onSubmit(event) {
    event.preventDefault();
    let {name, password} = this.refs;
    Relay.Store.update(
      new LoginMutation({
        name: name.value, password: password.value, viewer: this.props.viewer
      }),
      {onFailure: (t) => console.error(t.getError().source.errors)}
    );
  }

}

export default Relay.createContainer(AuthPage, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        identities {
          name
        },
        ${LoginMutation.getFragment('viewer')}
      }
    `
  }
});
