import React, {Component} from 'react';
import Relay from 'react-relay';

class AuthForm extends Component {

  render() {
    return (
      <form>
        <label>Username<input type="text"/></label>
        <label>Password<input type="password"/></label>
      </form>
    );
  }

}

export default Relay.createContainer(AuthForm, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        name
      }
    `
  }
});
