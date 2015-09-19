import React, {Component} from 'react';
import {Link} from 'react-router';

export default (props) => (
  <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
    <header className="mdl-layout__header">
      <div className="mdl-layout__header-row">
        <Link to="/concepts" className="mdl-layout-title mdl-navigation__link">
          owleo
        </Link>
        <div className="mdl-layout-spacer"/>
        <nav className="mdl-navigation">
          <Link to="/auth" className="mdl-navigation__link">Login/Signup</Link>
        </nav>
      </div>
    </header>
    <main className="mdl-layout__content">
      {props.children}
    </main>
  </div>
);
