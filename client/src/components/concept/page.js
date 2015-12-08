import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';
import {Link} from 'react-router';

import history from '../../history';
import pathToUrl from '../../path-to-url';
import SearchResults from './results';
import ConceptList from './list';
import ConceptInfo from './info';
import ConceptForm from './form';
import ConceptMap from './map';
import OwlPlaceholder from './owl-placeholder';
import {TextField, Button, Spinner} from '../mdl';
import CardAnimation from '../card-animation';

import './icon-switch.scss';

class ConceptPage extends Component {

  state = {concept: null, query: '', navType: localStorage.navType};

  componentWillMount() {
    this._setSelectedPath(this.props);
  }

  componentDidMount() {
    window.componentHandler.upgradeElement(this.refs.navSwitch);
  }

  componentWillReceiveProps(props) {
    this._setSelectedPath(props);
  }

  render() {
    let {viewer, relay} = this.props;
    let {conceptRoot, selectedConcept, targetConcept} = viewer;
    let {selectedPath, selectedId} = relay.variables;
    let {query, navType} = this.state;

    let hasSelection = selectedConcept &&
      (selectedId && this.state.selectedId || selectedPath && this.state.selectedPath);


    if (!selectedConcept) selectedConcept = {};
    let list;
    let showMap = navType == 'map';
    if (query) {
      list = <SearchResults {...{viewer, query}} selectedId={selectedConcept.id}
                            onSelect={this._onSearchSelect.bind(this)}/>;
    } else if (showMap && this.props.relay.variables.includeMap) {
      list = <ConceptMap concept={conceptRoot}
                         selectedId={hasSelection ? selectedConcept.id : null}/>;
    } else if (!showMap && this.props.relay.variables.includeList) {
      list = <ConceptList concept={conceptRoot} openDepth={1}
                          selectedPath={selectedPath ? selectedPath.split('/') : null}
                          selectedId={selectedConcept.id}/>;
    } else list = <Spinner/>;

    let emptyOwl = false;
    let content;
    if (this.state.isLoading) {
      content = <Spinner/>;
    } else if (this.props.children) {
      content = React.cloneElement(this.props.children, {viewer});
    } else if (hasSelection) {
      content = <ConceptInfo key={selectedConcept.id}
                             {...{viewer, concept: selectedConcept}}/>;
    } else {
      emptyOwl = true;
      content = <OwlPlaceholder/>
    }

    return (
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 10, overflow: 'hidden'}}>

        <div className="mdl-card"
             style={{width: '60%', maxWidth: navType == 'map' ? '800px' : '500px', height: '92vh', marginLeft: 10,
                     backgroundColor: 'white'}}>
          <div className="mdl-grid" style={{backgroundColor: 'white', margin: 0,
                        padding: 0, borderBottom: '1px solid rgba(0,0,0,0.5)'}}>
            <div className="mdl-cell mdl-cell--10-col">
              <TextField label="Search for concepts" ref="search"
                         onChange={this._onSearchChange.bind(this)}
                         onKeyUp={this._onSearchKeyUp.bind(this)}
                         outerStyle={{margin: '-20px 0', width: '100%'}}/>
            </div>
            <div className="mdl-cell mdl-cell--2-col">
              <label ref="navSwitch" className="icon-switch mdl-switch
                                                mdl-js-switch
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
          </div>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch"
               style={{overflowY: navType == 'map' ? 'hidden' : 'auto'}}>
          {list}
          </div>
        </div>

        <div style={{width: '100%', height: '92vh', justifyContent: 'center', overflowY: 'auto'}}>
          <CardAnimation>{content}</CardAnimation>
        </div>

        {viewer.user ? (
          <Link style={{position: 'fixed', right: 30, bottom: 30, zIndex: 1}}
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
    this.setState({query: event.target.value});
  }

  _onSearchKeyUp(event) {
    switch (event.keyCode) {
      case 27/*ESC*/:
        this.setState({query: this.refs.search.setValue('')});
        ReactDOM.findDOMNode(this.refs.search).classList.remove('is-dirty');
        break;
    }
  }

  _onSearchSelect() {
    this.setState({query: null});
    this.refs.search.value = null;
  }

  _onChangeNav(event) {
    let switchTo = event.target.checked ? 'map' : 'list';
    let listMode = switchTo == 'list';

    this.props.relay.setVariables({includeList: listMode, includeMap: !listMode});
    localStorage.setItem('navType', switchTo);
    this.setState({navType: switchTo});
  }

  _setSelectedPath(props) {
    let {viewer, params} = props;
    let {id, path, splat, targetId} = params;

    let {selectedConcept} = props.viewer;
    if (!targetId && id && selectedConcept && id == selectedConcept.id) {
      this.props.history.replaceState('', pathToUrl(selectedConcept.path));
    }
    if (id) {
      this.setState({selectedId: id, selectedPath: null});
      if (id == this.state.selectedId) return;
      this.setState({isLoading: true});
      this.props.relay.setVariables({selectedId: id, selectedPath: null},
        readyState => {
          if (readyState.done) this.setState({isLoading: false});
        });
    } else {
      let selectedPath = path + splat;
      this.setState({selectedPath, selectedId: null});
      if (!selectedPath || selectedPath == this.state.selectedPath) return;
      this.setState({isLoading: true});
      this.props.relay.setVariables({selectedPath, selectedId: null},
        readyState => {
          if (readyState.done) this.setState({isLoading: false});
        });
    }
  }

}

export default Relay.createContainer(ConceptPage, {

  initialVariables: {
    selectedPath: null, selectedId: null,
    includeList: !localStorage.navType || localStorage.navType == 'list',
    includeMap: localStorage.navType == 'map'
  },

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        user {id}
        conceptRoot {
          ${ConceptList.getFragment('concept').if(vars.includeList)}
          ${ConceptMap.getFragment('concept').if(vars.includeMap)}
        }
        selectedConcept: concept(path: $selectedPath, id: $selectedId) {
          id
          path {name}
          ${ConceptInfo.getFragment('concept')}
        }
        ${SearchResults.getFragment('viewer')}
        ${ConceptForm.getFragment('viewer')}
        ${ConceptInfo.getFragment('viewer')}
      }
    `
  }
});
