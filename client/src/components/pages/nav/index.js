import React from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';
import {Link} from 'react-router';
import classnames from 'classnames';
import {Card, Cell, FABButton, Grid, Icon, Spinner, Textfield} from 'react-mdl';

import history from '../../../history';
import createConceptURL from '../../../helpers/create-concept-url';
import ConceptSimpleList from './simple-list';
import ConceptList from './list';
import ConceptMap from './map';
import SearchResults from './../../concept/results';
import ConceptInfo from '../../concept/info/';
import ConceptForm from './../../concept/form';
import OwlPlaceholder from '../../owl-placeholder/';
import CardAnimation from './../../card-animation';


class ConceptPage extends React.Component {

  state = {concept: null, query: '', navType: localStorage.navType || 'simpleList'};

  componentWillMount() {
    this._setSelected(this.props);
  }

  componentWillReceiveProps(props) {
    this._setSelected(props);
  }

  render() {
    const {viewer, relay} = this.props;
    let {conceptRoot, selectedConcept} = viewer;
    const {
      selectedId, includeDeepList, includeSimpleList, includeMap
      } = relay.variables;
    const {query, navType} = this.state;

    const hasSelection = selectedConcept && selectedId && this.state.selectedId;

    if (!hasSelection) {
      selectedConcept = {};
      document.title = 'Concepts';
    }

    const selectedPath = (selectedConcept.path || []).map(({id}) => id).reverse();

    let list;
    if (query) {
      list = <SearchResults {...{viewer, query}} selectedId={selectedConcept.id}
                            onSelect={this._clearSearch.bind(this)}/>;
    } else if (navType == 'simpleList' && includeSimpleList) {
      list = <ConceptSimpleList viewer={viewer}
                                selectedId={hasSelection ? selectedConcept.id : null}/>;
    } else if (navType == 'deepList' && includeDeepList) {
      list = <ConceptList concept={conceptRoot} selectedPath={selectedPath}/>;
    } else if (navType == 'map' && includeMap) {
      list = <ConceptMap concept={conceptRoot}
                         selectedId={hasSelection ? selectedConcept.id : null}/>;
    } else list = <Spinner style={{left: '50%', top: '5px'}}/>;

    let emptyOwl = false;
    let content;
    let contentLoading;
    let animateContent = false;
    if (this.state.isLoading) {
      contentLoading = <Spinner key="loading" style={{left: '50%', top: '5px'}}/>;
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
      <div className="concept-nav-container">

        <div className="nav-negative-margin">

          <Card className="concept-nav">
            <Grid style={{backgroundColor: 'white', margin: 0, padding: 0,
                          borderBottom: '1px solid rgba(0,0,0,0.5)'}}>
              <Cell col={8}>
                <Textfield ref="search" label="Search for concepts"
                           onChange={this._handleSearchChange.bind(this)}
                           onKeyUp={this._handleSearchKeyUp.bind(this)}
                           style={{margin: '-20px 0', width: '100%'}}/>
              </Cell>
              <Cell col={4}>
                <select onChange={this._handleChangeNav.bind(this)}
                        defaultValue={navType}>
                  <option value="simpleList">Simple List</option>
                  <option value="deepList">Deep List</option>
                  <option value="map">Map</option>
                </select>
              </Cell>
            </Grid>
            <Cell col={12} align="stretch"
                  style={{width: '100%', margin: 0,
                          overflowY: navType == 'map' ? 'hidden' : 'auto'}}>
              {list}
            </Cell>
          </Card>

          <div className="card-container concept-scroller">
            <div style={{marginTop: 10}}>
              {contentLoading}
              {content}
            </div>
          </div>

        </div>


        <span style={{position: 'fixed', right: 30, bottom: 30, zIndex: 1}}
              className={classnames('fab-hideable', {'fab-hidden': !isLearnable})}
              title="Start mastering this concept!">
          <Link to={'/learn/' + selectedConcept.id}>
            <FABButton id="learn" disabled={!isLearnable} colored ripple>
                <Icon name="school"/>
            </FABButton>
          </Link>
        </span>

      </div>

    );
  }

  _handleSearchChange(event) {
    this.setState({query: event.target.value});
  }

  _handleSearchKeyUp(event) {
    switch (event.keyCode) {
      case 27/*ESC*/:
        this._clearSearch();
        break;
    }
  }

  _clearSearch() {
    this.setState({query: null});
    const {search} = this.refs;
    search.refs.input.value = '';
    ReactDOM.findDOMNode(search).classList.remove('is-dirty');
  }

  _handleChangeNav(event) {
    const {value} = event.target;

    this.props.relay.setVariables({
      includeSimpleList: value == 'simpleList',
      includeDeepList: value == 'deepList',
      includeMap: value == 'map'
    });
    localStorage.setItem('navType', value);
    this.setState({navType: value});
  }

  _setSelected({viewer, location}) {
    const {selectedConcept} = viewer;
    const {id} = location.query;

    if (id && selectedConcept && id == atob(selectedConcept.id).split(':')[1]) {
      const url = createConceptURL(selectedConcept);
      const {pathname, search} = this.props.location;
      if (pathname + search != url) this.props.history.replaceState('', url);
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
    includeSimpleList: !localStorage.navType || localStorage.navType == 'simpleList',
    includeDeepList: localStorage.navType == 'deepList',
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
          ${ConceptList.getFragment('concept').if(vars.includeDeepList)}
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
        ${ConceptSimpleList.getFragment('viewer').if(vars.includeSimpleList)}
        ${SearchResults.getFragment('viewer')}
        ${ConceptForm.getFragment('viewer')}
        ${ConceptInfo.getFragment('viewer')}
      }
    `
  }
});
