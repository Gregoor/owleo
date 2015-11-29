import React, {Component} from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';

import SearchResults from './results';
import ConceptBreadcrumbs from './breadcrumbs';
import ConceptList from './list';
import ConceptInfo from './info';
import ConceptForm from './form';
import ConceptMap from './map';
import pathToUrl from '../../path-to-url';

import './icon-switch.scss';

class ConceptPage extends Component {

  state = {concept: null, query: '', navType: localStorage.navType};

  componentWillMount() {
    this._setSelectedPath(this.props);
  }

  componentWillReceiveProps(props) {
    this._setSelectedPath(props);
  }

  render() {
    let {viewer, relay} = this.props;
    let {conceptRoot, concept} = viewer;
    let {selectedPath, selectedId} = relay.variables;
    let {query, navType} = this.state;

    let hasSelection = concept && (selectedId && this.state.selectedId) ||
      (selectedPath && this.state.selectedPath);

    if (!concept) concept = {};
    let list;
    let showMap = navType == 'map';
    if (showMap) {
      list = <ConceptMap concept={conceptRoot}
                         selectedId={hasSelection ? concept.id : null}/>;
    } else if (query) {
      list = <SearchResults {...{viewer, query}} selectedId={concept.id}/>;
    } else {
      list = <ConceptList concept={conceptRoot}
                          selectedPath={selectedPath ? selectedPath.split('/') : null}
                          selectedId={concept.id}/>;
    }

    let content;
    if (this.props.children) {
      content = React.cloneElement(this.props.children, {viewer});
    } else {
      content = hasSelection ?
        <ConceptInfo key={concept.id} {...{viewer, concept}}/> : '';
    }

    return (
      <div className="mdl-grid" style={{maxWidth: '1300px'}}>

        <div className="mdl-cell mdl-cell--6-col mdl-shadow--2dp"
             style={{maxWidth: navType == 'map' ? '800px' : '500px', margin: 0,
                     backgroundColor: 'white'}}>
          <div className="mdl-grid" style={{backgroundColor: 'white', margin: 0,
                        borderBottom: '1px solid rgba(0,0,0,0.5)'}}>
            <div className="mdl-cell mdl-cell--10-col">
              <div ref="searchContainer"
                   className="mdl-textfield mdl-js-textfield
                            mdl-textfield--expandable
                            mdl-textfield--floating-label"
                   style={{padding: 0}}>
                <label className="mdl-button mdl-js-button mdl-button--icon"
                       htmlFor="search" style={{bottom: 0}}>
                  <i className="material-icons">search</i>
                </label>
                <div className="mdl-textfield__expandable-holder">
                  <input className="mdl-textfield__input" id="search" type="text"
                         ref="search" placeholder="Search for concepts"
                         onChange={this._onSearchChange.bind(this)}
                         onKeyUp={this._onSearchKeyUp.bind(this)}/>
                </div>
              </div>
            </div>
            <div className="mdl-cell mdl-cell--2-col">
              <label className="icon-switch mdl-switch mdl-js-switch
                                mdl-js-ripple-effect"
                     style={{width: 'auto', marginRight: '15px'}}>
                <input type="checkbox" className="mdl-switch__input"
                       onChange={this._onChangeNav.bind(this)}
                       defaultChecked={showMap}/>
                <i className={`material-icons on ${showMap ? 'hide' : ''}`}
                   key="list">
                  list
                </i>
                <i className={`material-icons off ${!showMap ? 'hide' : ''}`}
                   key="map">
                  layers
                </i>
                <span className="mdl-switch__label"/>
              </label>
            </div>
            <div className="mdl-cell mdl-cell--12-col">
              <ConceptBreadcrumbs concept={hasSelection ? concept : null}/>
            </div>
          </div>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch"
               style={{overflowY: navType == 'map' ? 'auto' : 'scroll', height: '78vh'}}>
          {list}
          </div>
        </div>

        <div className="mdl-cell mdl-cell--6-col"
             style={{maxWidth: 512, margin: '0 auto'}}>
          {content}
        </div>

        {viewer.user ? (
          <Link style={{position: 'fixed', right: 30, bottom: 30}}
                className="mdl-button mdl-js-button mdl-button--fab
                           mdl-js-ripple-effect mdl-button--colored"
                to="/concepts/new">
            <i className="material-icons">add</i>
          </Link>
        ) : ''}

      </div>
    );
  }

  _onSearchChange(event) {
    this._navigateToConcepts();
    this.setState({query: event.target.value});
  }

  _onSearchKeyUp(event) {
    switch (event.keyCode) {
      case 13/*ENTER*/:
        this._navigateToConcepts();
        break;
      case 27/*ESC*/:
        this.setState({query: this.refs.search.value = ''});
        this.refs.searchContainer.classList.remove('is-dirty');
        break;
    }
  }

  _navigateToConcepts() {
    let {history} = this.props;
    if (!history.isActive('/concepts')) history.pushState({}, '/concepts');
  }

  _onChangeNav(event) {
    let switchTo = event.target.checked ? 'map' : 'list';
    localStorage.setItem('navType', switchTo);
    this.setState({navType: switchTo});
  }

  _setSelectedPath(props) {
    let {params} = props;
    let {id, path, splat} = params;

    let {concept} = props.viewer;
    if (id && concept && id == concept.id) {
      this.props.history.replaceState('', pathToUrl(concept.path));
    }
    if (id) {
      this.setState({selectedId: id, selectedPath: null});
      if (id == this.state.selectedId) return;
      this.props.relay.setVariables({selectedId: id, selectedPath: null});
    } else {
      let selectedPath = path + splat;
      this.setState({selectedPath, selectedId: null});
      if (!selectedPath || selectedPath == this.state.selectedPath) return;
      this.props.relay.setVariables({selectedPath, selectedId: null});
    }
  }

}

export default Relay.createContainer(ConceptPage, {

  initialVariables: {selectedPath: null, selectedId: null},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        user {
          id
        }
        conceptRoot {
          ${ConceptList.getFragment('concept')}
          ${ConceptMap.getFragment('concept')}
        },
        concept(path: $selectedPath, id: $selectedId) {
          id,
          path {
            name
          }
          ${ConceptBreadcrumbs.getFragment('concept')}
          ${ConceptInfo.getFragment('concept')}
        },
        ${SearchResults.getFragment('viewer')}
        ${ConceptForm.getFragment('viewer')}
        ${ConceptInfo.getFragment('viewer')}
      }
    `
  }
});
