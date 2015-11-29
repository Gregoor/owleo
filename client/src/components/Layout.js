import React, {Component} from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';

import LogoutMutation from '../mutations/user/logout';

class Layout extends Component {

  componentDidUpdate() {
    window.componentHandler.upgradeDom();
  }

  render() {
    let {user} = this.props.viewer;
    let authButton = user ? (
      <a href="" className="mdl-navigation__link"
         onClick={this.onLogout.bind(this)}>
        Logout ({user.name})
      </a>
    ) : <Link to="/auth" className="mdl-navigation__link">Login</Link>;

    return (
      <div className="mdl-layout">
        <header className="mdl-layout__header">
          <div className="mdl-layout__header-row">
            <Link to="/concepts"
                  className="mdl-layout-title mdl-navigation__link">
              owleo
            </Link>
            <div className="mdl-layout-spacer"/>
            <nav className="mdl-navigation">
              {authButton}
            </nav>
          </div>
        </header>
        <main className="mdl-layout__content" style={{overflow: 'hidden'}}>
          {this.props.children}
        </main>
      </div>
    );
  }

  onLogout(event) {
    event.preventDefault();
    Relay.Store.update(new LogoutMutation(),
      {
        onSuccess: (t) => location.reload(),
        onFailure: (t) => console.error(t.getError().source.errors)
      }
    );
  }

}

export default Relay.createContainer(Layout, {

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
