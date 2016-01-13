import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import classnames from 'classnames';
import {Content, Drawer, Header, Layout, Navigation} from 'react-mdl';

import LogoutMutation from '../mutations/user/logout';

import './layout.scss';

class AppLayout extends React.Component {

  render() {
    const {user} = this.props.viewer;
    const [, root, next] = this.props.location.pathname.split('/');
    const isConceptRoute = root == 'concepts' && next != 'new';

    const links = [];

    if (user && user.admin) links.push(
      <Link key="new" to="/concepts/new" className="mdl-navigation__link"
            activeClassName="is-active">
        New Concept
      </Link>
    );

    links.push(
      <Link key="concepts" to="/concepts"
            className={classnames('mdl-navigation__link',
                                                {'is-active': isConceptRoute})}>
        Concepts
      </Link>,
      <Link key="about" to="/about" className="mdl-navigation__link"
            activeClassName="is-active">
      About
      </Link>
    );

    links.push(user && !user.isGuest ?
      <a key="logout" href="" className="mdl-navigation__link"
         onClick={this._handleLogout.bind(this)}>
        Logout
        (<span style={{textTransform: 'none'}}>{user.name}</span>)
      </a>
      :
      <Link key="login" to="/auth" className="mdl-navigation__link"
            activeClassName="is-active">
        Register / Login
      </Link>
    );

    return (
      <Layout fixedHeader>
        <Header title="owleo">
          <Navigation>{links}</Navigation>
        </Header>
        <Drawer>
          <Navigation>{links}</Navigation>
        </Drawer>
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
