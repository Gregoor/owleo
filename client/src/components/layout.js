import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import classnames from 'classnames';
import {Layout, Header, Navigation, Content} from 'react-mdl';

import LogoutMutation from '../mutations/user/logout';

class AppLayout extends React.Component {

  render() {
    const {user} = this.props.viewer;
    const [, root, next] = this.props.location.pathname.split('/');
    const isConceptRoute = root == 'concepts' && next != 'new';

    return (
      <Layout>
        <Header title="owleo">
          <Navigation>
            {!user || !user.admin ? <span/> : (
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
          </Navigation>
        </Header>
        <Content>{this.props.children}</Content>
      </Layout>
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

export default Relay.createContainer(AppLayout, {

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
