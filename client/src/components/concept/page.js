import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';
import {Link} from 'react-router';
import classnames from 'classnames';

import history from '../../history';
import createConceptURL from '../../helpers/create-concept-url';
import SearchResults from './results';
import ConceptList from './list';
import ConceptInfo from './info';
import ConceptForm from './form';
import ConceptMap from './map';
import OwlPlaceholder from '../owl-placeholder/owl-placeholder';
import {TextField, Button, Spinner} from '../mdl';
import CardAnimation from '../card-animation';

import './icon-switch.scss';

class ConceptPage extends Component {

  state = {concept: null, query: '', navType: localStorage.navType};

  componentWillMount() {
    this._setSelected(this.props);
  }

  componentDidMount() {
    window.componentHandler.upgradeElement(this.refs.navSwitch);
  }

  componentWillReceiveProps(props) {
    this._setSelected(props);
  }

  render() {
    const {viewer, relay} = this.props;
    let {conceptRoot, selectedConcept} = viewer;
    const {selectedId} = relay.variables;
    const {query, navType} = this.state;

    const hasSelection = selectedConcept && selectedId && this.state.selectedId;

    if (!hasSelection) {
      selectedConcept = {};
      document.title = 'Concepts';
    }

    const selectedPath = (selectedConcept.path || []).map(({id}) => id).reverse();

    let list;
    let showMap = navType == 'map';
    if (query) {
      list = <SearchResults {...{viewer, query}} selectedId={selectedConcept.id}
                            onSelect={this._onSearchSelect.bind(this)}/>;
    } else if (showMap && this.props.relay.variables.includeMap) {
      list = <ConceptMap concept={conceptRoot}
                         selectedId={hasSelection ? selectedConcept.id : null}/>;
    } else if (!showMap && this.props.relay.variables.includeList) {
      list = <ConceptList concept={conceptRoot} selectedPath={selectedPath}/>;
    } else list = <Spinner/>;

    let emptyOwl = false;
    let content;
    let contentLoading;
    let animateContent = false;
    if (this.state.isLoading) {
      contentLoading = <Spinner/>;
      animateContent = true;
    } else if (this.props.children) {
      content = React.cloneElement(this.props.children, {viewer});
    } else if (hasSelection) {
      content = <ConceptInfo key={selectedConcept.id}
                             {...{viewer, concept: selectedConcept}}/>;
      animateContent = true;
    } else {
      emptyOwl = true;
      content = <OwlPlaceholder/>
    }

    if (animateContent) content = <CardAnimation>{content}</CardAnimation>;

    const isLearnable = selectedConcept.reqs && selectedConcept.reqs.length;

    return (
      <div style={{display: 'flex', justifyContent: 'center', overflow: 'hidden'}}>

        <div className="mdl-card"
             style={{width: '60%', maxWidth: navType == 'map' ? '800px' : '500px',
                    height: '92vh', marginTop: 10, marginLeft: 10,
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

        <div className="card-container"
             style={{width: '100%', height: '92vh', justifyContent: 'center', overflowY: 'auto'}}>
          <div style={{marginTop: 10}}>
            {contentLoading}
            {content}
          </div>
        </div>

        <span style={{position: 'fixed', right: 30, bottom: 30, zIndex: 1}}
              className={classnames('fab-hideable', {'fab-hidden': !isLearnable})}
              title="Start mastering this concept!">
          <Button id="learn" to={'/learn/' + selectedConcept.id}
                    disabled={!isLearnable} buttonType="fab colored">
            <i className="material-icons">school</i>
          </Button>
        </span>

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

  _setSelected({viewer, location}) {
    const {id} = location.query;
    const {selectedConcept} = viewer;

    if (id && selectedConcept && id == selectedConcept.id && id != this.state.selectedId) {
      this.props.history.replaceState('', createConceptURL(selectedConcept));
    }

    if (id) {
      this.setState({selectedId: id});
      if (id == this.state.selectedId) return;
      this.setState({isLoading: true});
      this.props.relay.setVariables({selectedId: id},
        readyState => {
          if (readyState.done) this.setState({isLoading: false});
        });
    } else if (this.state.selectedId) {
      this.setState({selectedId: null});
      this.props.relay.setVariables({selectedId: null});
    }
  }

}

export default Relay.createContainer(ConceptPage, {

  initialVariables: {
    selectedId: null,
    includeList: !localStorage.navType || localStorage.navType == 'list',
    includeMap: localStorage.navType == 'map'
  },

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        user {
          id
          admin
        }
        conceptRoot {
          ${ConceptList.getFragment('concept').if(vars.includeList)}
          ${ConceptMap.getFragment('concept').if(vars.includeMap)}
        }
        selectedConcept: concept(id: $selectedId) {
          id
          reqs { id }
          path {
            id
            name
          }
          ${ConceptInfo.getFragment('concept')}
        }
        ${SearchResults.getFragment('viewer')}
        ${ConceptForm.getFragment('viewer')}
        ${ConceptInfo.getFragment('viewer')}
      }
    `
  }
});
