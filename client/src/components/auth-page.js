import React, {Component} from 'react';
import Relay from 'react-relay';

class AuthPage extends Component {

  render() {
    return (
      <form>
        <label><input type="checkbox"/> I'm new here</label>
        <label>Username<input type="text"/></label>
        <label>Password<input type="password"/></label>
        <button type="submit">{1 ? 'Login' : 'Signup'}</button>
      </form>
    );
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
