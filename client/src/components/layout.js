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
    return (
      <div className="mdl-layout">
        <header className="mdl-layout__header">
          <div className="mdl-layout__header-row">
            <Link to="/concepts"
                  className="mdl-layout-title mdl-navigation__link">
              owleo
            </Link>
            <div className="mdl-layout-spacer"/>
            <Link to="/about" className="mdl-navigation__link"
                  activeClassName="is-active">
              About
            </Link>
            <nav className="mdl-navigation">
              {user ?
                (
                  <a href="" className="mdl-navigation__link"
                     onClick={this.onLogout.bind(this)}>
                    Logout ({user.name})
                  </a>
                ) :
                (
                  <Link to="/auth" className="mdl-navigation__link"
                        activeClassName="is-active">
                    Login
                  </Link>
                )
              }
            </nav>
          </div>
        </header>
        <main className="mdl-layout__content">
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
