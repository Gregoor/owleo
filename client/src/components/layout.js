import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import classnames from 'classnames';

import LogoutMutation from '../mutations/user/logout';

class Layout extends React.Component {

  componentDidUpdate() {
    window.componentHandler.upgradeDom();
  }

  render() {
    const {user} = this.props.viewer;
    const [, root, next] = this.props.location.pathname.split('/');
    const isConceptRoute = root == 'concepts' && next != 'new';

    return (
      <div className="mdl-layout">
        <header className="mdl-layout__header">
          <div className="mdl-layout__header-row">
            <div  className="mdl-layout-title">
              owleo
            </div>
            <div className="mdl-layout-spacer"/>
            {!user || !user.admin ? '' : (
              <Link to="/concepts/new" className="mdl-navigation__link"
                    activeClassName="is-active">
                New Concept
              </Link>
            )}
            <Link to="/concepts" className={classnames('mdl-navigation__link',
                                                {'is-active': isConceptRoute})}>
              Concepts
            </Link>
            <Link to="/about" className="mdl-navigation__link"
                  activeClassName="is-active">
              About
            </Link>
            <nav className="mdl-navigation">
              {user && !user.isGuest ?
                (
                  <a href="" className="mdl-navigation__link"
                     onClick={this._handleLogout.bind(this)}>
                    Logout
                    (<span style={{textTransform: 'none'}}>{user.name}</span>)
                  </a>
                ) :
                (
                  <Link to="/auth" className="mdl-navigation__link"
                        activeClassName="is-active">
                    Register / Login
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

  _handleLogout(event) {
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
          admin
          isGuest
        }
      }
    `
  }

});
