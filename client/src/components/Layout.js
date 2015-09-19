import React, {Component} from 'react';
import {Link} from 'react-router';

class Layout extends Component {

  state = {query: ''};

  componentDidUpdate() {
    window.componentHandler.upgradeDom();
  }

  render() {
    let children = React.cloneElement(this.props.children,
      {query: this.state.query});
    return (
      <div className="mdl-layout">
        <header className="mdl-layout__header">
          <div className="mdl-layout__header-row">
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
              <Link to="/auth" className="mdl-navigation__link">Login/Signup</Link>
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

  navigateToConcepts() {
    let {history} = this.props;
    if (!history.isActive('/concepts')) history.pushState({}, '/concepts');
  }

}

export default Layout;
