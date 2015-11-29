import React, {Component} from 'react';
import {Link} from 'react-router';

import './icon-switch.scss';

class Layout extends Component {

  state = {query: '', navType: localStorage.navType};

  componentDidUpdate() {
    window.componentHandler.upgradeDom();
  }

  render() {
    let {navType, query} = this.state;

    let children = React.cloneElement(this.props.children, {query, navType});

    let showMap = navType == 'map';

    return (
      <div className="mdl-layout">
        <header className="mdl-layout__header">
          <div className="mdl-layout__header-row">
            <label className="icon-switch mdl-switch mdl-js-switch mdl-js-ripple-effect"
                   style={{width: 'auto', marginRight: '15px'}}>
              <input type="checkbox" className="mdl-switch__input"
                     onChange={this.onChangeNav.bind(this)} defaultChecked={showMap}/>
              <i className={`material-icons on ${showMap ? 'hide' : ''}`} key="list">
                list
              </i>
              <i className={`material-icons off ${!showMap ? 'hide' : ''}`} key="map">
                layers
              </i>
              <span className="mdl-switch__label"/>
            </label>
            <div className="mdl-textfield mdl-js-textfield
                    mdl-textfield--expandable mdl-textfield--floating-label
                    mdl-textfield--align-right" ref="searchContainer">
              <label className="mdl-button mdl-js-button mdl-button--icon"
                     htmlFor="search">
                <i className="material-icons">search</i>
              </label>
              <div className="mdl-textfield__expandable-holder">
                <input className="mdl-textfield__input" id="search" type="text"
                       name="sample" ref="search"
                       onChange={this.onSearchChange.bind(this)}
                       onKeyUp={this.onSearchKeyUp.bind(this)}/>
              </div>
            </div>
            <Link to="/concepts"
                  className="mdl-layout-title mdl-navigation__link">
              owleo
            </Link>
            <div className="mdl-layout-spacer"/>
            <nav className="mdl-navigation">
              <Link to="/auth" className="mdl-navigation__link">Login</Link>
            </nav>
          </div>
        </header>
        <main className="mdl-layout__content"
              style={{height: '100%', overflow: 'hidden'}}>
          {children}
        </main>
      </div>
    );
  }

  onSearchChange(event) {
    this.navigateToConcepts();
    this.setState({query: event.target.value});
  }

  onSearchKeyUp(event) {
    switch (event.keyCode) {
      case 13/*ENTER*/:
        this.navigateToConcepts();
        break;
      case 27/*ESC*/:
        this.setState({query: this.refs.search.value = ''});
        this.refs.searchContainer.classList.remove('is-dirty');
        break;
    }
  }

  onChangeNav(event) {
    let switchTo = event.target.checked ? 'map' : 'list';
    localStorage.setItem('navType', switchTo);
    this.setState({navType: switchTo});
  }

  navigateToConcepts() {
    let {history} = this.props;
    if (!history.isActive('/concepts')) history.pushState({}, '/concepts');
  }

}

export default Layout;
