import React, {Component} from 'react';
import Relay from 'react-relay';

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
        <div className="mdl-card__supporting-text">
          <form >
            <div className="mdl-textfield mdl-js-textfield">
              <input className="mdl-textfield__input" type="text" id="name" />
              <label className="mdl-textfield__label" htmlFor="name">
                Username
              </label>
            </div>
            <div className="mdl-textfield mdl-js-textfield">
              <input className="mdl-textfield__input" type="password"
                     id="password" />
              <label className="mdl-textfield__label" htmlFor="password">
                Password
              </label>
            </div>
            <label className="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect"
                   for="is-new">
              <input type="checkbox" id="is-new"
                     className="mdl-checkbox__input"
                     onChange={this.onChangeNew.bind(this)}/>
              <span className="mdl-checkbox__label">I'm a new user</span>
            </label>
          </form>
        </div>
        <div className="mdl-card__actions mdl-card--border">
          <button className="mdl-button mdl-button--colored mdl-js-button
                              mdl-js-ripple-effect">
            {loginMode ? 'Login' : 'Signup'}
          </button>
        </div>
      </div>
    );
  }

  onChangeNew(event) {
    this.setState({loginMode: !event.target.checked});
  }

}

export default Relay.createContainer(AuthPage, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        name
      }
    `
  }
});
