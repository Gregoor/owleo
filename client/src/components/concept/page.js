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
    let {conceptRoot, selectedConcept, targetConcept, learnPath} = viewer;
    let {selectedPath, selectedId} = relay.variables;
    let {query, navType} = this.state;

    let hasSelection = selectedConcept && (selectedId && this.state.selectedId) ||
      (selectedPath && this.state.selectedPath);

    if (!selectedConcept) selectedConcept = {};
    let list;
    let showMap = navType == 'map';
    if (query) {
      list = <SearchResults {...{viewer, query}} selectedId={selectedConcept.id}
                            onSelect={this._onSearchSelect.bind(this)}/>;
    } else if (showMap) {
      list = <ConceptMap concept={conceptRoot}
                         selectedId={hasSelection ? selectedConcept.id : null}/>;
    } else {
      list = <ConceptList concept={conceptRoot}
                          selectedPath={selectedPath ? selectedPath.split('/') : null}
                          selectedId={selectedConcept.id}/>;
    }

    let emptyOwl = false;
    let content;
    if (this.props.children) {
      content = React.cloneElement(this.props.children, {viewer});
    } else if (hasSelection) {
      let learnBar;
      if (learnPath) {
        let conceptIndex = learnPath.indexOf(selectedConcept.id);
        learnBar = (
          <div className="mdl-cell mdl-cell--12-col"
               style={{textAlign: 'center'}}>
            <Button to={this._getLearnRouteFor(learnPath[conceptIndex - 1])}
                    disabled={conceptIndex == 0} style={{width: '100px'}}>
              Previous
            </Button>
            <span style={{margin: '0 10px'}}>
              Learning&nbsp;
              <a href={pathToUrl(targetConcept.path)}>
                {targetConcept.name}
              </a>
              &nbsp;
              ({conceptIndex + 1}/{learnPath.length})
              </span>
            <Button to={this._getLearnRouteFor(learnPath[conceptIndex + 1])}
                    disabled={conceptIndex + 1 == learnPath.length}
                    style={{width: '100px'}}>
              Next
            </Button>
          </div>
        )
      }
      content = (
        <div className="mdl-grid">
          {learnBar}
          <ConceptInfo key={selectedConcept.id} learnMode={Boolean(learnPath)}
                       {...{viewer, concept: selectedConcept}}/>
        </div>
      );
    } else if (this.state.loading) {
      content = <Spinner/>;
    } else {
      emptyOwl = true;
      content = <OwlPlaceholder/>
    }

    return (
      <div className="mdl-grid" style={{maxWidth: '1300px'}}>

        <div className="mdl-cell mdl-cell--6-col mdl-shadow--2dp"
             style={{maxWidth: navType == 'map' ? '800px' : '500px', margin: 0,
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
               style={{overflowY: navType == 'map' ? 'auto' : 'scroll', height: '84vh'}}>
          {list}
          </div>
        </div>

        <div className={'mdl-cell mdl-cell--6-col ' + (emptyOwl ? 'mdl-cell--middle' : '')}>
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
    localStorage.setItem('navType', switchTo);
    this.setState({navType: switchTo});
  }

  _setSelectedPath(props) {
    let {viewer, params} = props;
    let {id, path, splat, targetId} = params;

    if (viewer.learnPath && !id) {
      history.pushState(null, this._getLearnRouteFor(viewer.learnPath[0], targetId));
    }

    if (this.props.relay.variables.targetId != targetId) {
      this.props.relay.setVariables({targetId});
    }

    let {selectedConcept} = props.viewer;
    if (!targetId && id && selectedConcept && id == selectedConcept.id) {
      this.props.history.replaceState('', pathToUrl(selectedConcept.path));
    }
    if (id) {
      this.setState({selectedId: id, selectedPath: null});
      if (id == this.state.selectedId) return;
      this.setState({loading: true});
      this.props.relay.setVariables({selectedId: id, selectedPath: null},
        readyState => {
          if (readyState.done) this.setState({loading: false});
        });
    } else {
      let selectedPath = path + splat;
      this.setState({selectedPath, selectedId: null});
      if (!selectedPath || selectedPath == this.state.selectedPath) return;
      this.setState({loading: true});
      this.props.relay.setVariables({selectedPath, selectedId: null},
        readyState => {
          if (readyState.done) this.setState({loading: false});
        });
    }
  }

  _getLearnRouteFor(id, targetId = this.props.params.targetId) {
    return `/learn/${targetId}/${id}`
  }

}

export default Relay.createContainer(ConceptPage, {

  initialVariables: {selectedPath: null, selectedId: null, targetId: null},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        user {id}
        conceptRoot {
          ${ConceptList.getFragment('concept')}
          ${ConceptMap.getFragment('concept')}
        }
        selectedConcept: concept(path: $selectedPath, id: $selectedId) {
          id
          path {name}
          ${ConceptInfo.getFragment('concept')}
        }
        targetConcept: concept(id: $targetId) {
          name
          path {name}
        }
        learnPath(targetId: $targetId)
        ${SearchResults.getFragment('viewer')}
        ${ConceptForm.getFragment('viewer')}
        ${ConceptInfo.getFragment('viewer')}
      }
    `
  }
});
