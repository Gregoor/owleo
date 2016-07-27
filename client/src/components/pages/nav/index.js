import React from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';
import {Card, IconButton, Spinner} from 'react-mdl';

import history from '../../../history';
import fromGlobalID from '../../../helpers/from-global-id';
import createConceptURL from '../../../helpers/create-concept-url';
import ConceptSimpleList from './simple-list';
import SearchResults from './../../concept/results';
import ConceptBreadcrumbs from '../../concept/breadcrumbs';
import ConceptCard from '../../concept/card/';
import ConceptForm from '../../concept/form';
import OwlPlaceholder from '../../owl-placeholder/';
import {CenteredSpinner} from '../../icons';


class ConceptPage extends React.Component {

  state = {concept: null, query: '', showSearch: false};

  componentWillMount() {
    this._setSelected(this.props);
  }

  componentWillReceiveProps(props) {
    this._setSelected(props);
  }

  render() {
    const {viewer, relay: {variables: {selectedID}}} = this.props;
    const {query} = this.state;
    let {selectedConcept} = viewer;

    const hasSelection = selectedConcept && selectedID && this.state.selectedID;

    if (!hasSelection) {
      selectedConcept = {};
      document.title = 'Owleo';
    }

    return (
      <div style={{display: 'flex', justifyContent: 'center'}}>

        <div style={{width: 700}}>
          <div style={{margin: 10, minHeight: 28}}>
            {hasSelection && !this.state.showSearch ?
              <div>
                <IconButton name="search" raised style={{marginRight: 10}}
                            onClick={this._showSearch.bind(this)}/>
                <ConceptBreadcrumbs concept={selectedConcept} showHome/>
              </div> :
              <Card>
                <input placeholder="Search for something you want to learn about"
                       type="text" defaultValue={this.state.query}
                       className="search-field"
                       onChange={this._handleSearchChange.bind(this)}
                       onKeyUp={this._handleSearchKeyUp.bind(this)}
                       style={{
                        margin: '0 10', width: '100%', height: 28,
                        border: 0, fontSize: 17
                       }}/>
              </Card>
            }
          </div>
          {this.props.relay.variables.includeResults && query ?
            <div style={{margin: '0 10'}}>
              <SearchResults {...{viewer, query, selectedID}}
                             onSelect={this._clearSearch.bind(this)}/>
            </div> :
            this._renderNav(hasSelection, selectedConcept)
          }
        </div>

      </div>

    );
  }

  _renderNav(hasSelection, selectedConcept) {
    const {children, relay: {variables: {selectedID}}, viewer} = this.props;

    let content;
    if (this.state.isLoading) {
      content = <Spinner key="loading" style={{left: '50%', top: '5px'}}/>;
    } else if (this.props.children) {
      content = React.cloneElement(children, {viewer});
    } else if (hasSelection) {
      content = <ConceptCard key={selectedConcept.id} showReqs
                             {...{viewer, concept: selectedConcept}}/>;
    } else {
      content = <OwlPlaceholder/>
    }

    return (
      <div className="concept-nav-container">
        <div className="nav-negative-margin">
          <Card className="concept-nav">
            <ConceptSimpleList viewer={viewer} id={selectedID}/>
          </Card>
          <div className="card-container concept-scroller">
            <div style={{marginBottom: 15}}>
              {content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  _handleSearchChange(event) {
    const {value: query} = event.target;

    history.push('/search/' + query);
  }

  _handleSearchKeyUp(event) {
    switch (event.keyCode) {
      case 27/*ESC*/:
        this._clearSearch();
        break;
    }
  }

  _showSearch() {
    this.setState({showSearch: true});
  }

  _clearSearch() {
    this.setState({showSearch: false, query: null});
  }

  _setSelected({params: {query}, viewer, location}) {
    const {selectedConcept} = viewer;
    const {id} = location.query;

    if (this.state.query != query) {
      this.props.relay.setVariables({includeResults: Boolean(query)});
      this.setState({query});
    }

    this.setState({showSearch: false});

    if (id && selectedConcept && selectedConcept.id && id == fromGlobalID(selectedConcept.id)) {
      const url = createConceptURL(selectedConcept);
      const {pathname, search} = this.props.location;
      if (pathname + search != url) history.replace(url);
    }

    if (id) {
      this.setState({selectedID: id});
      if (id == this.state.selectedID) return;
      this.setState({isLoading: true});
      this.props.relay.setVariables({selectedID: id}, (readyState) => {
        if (readyState.done) this.setState({isLoading: false});
      });
    } else if (this.state.selectedID) {
      this.setState({selectedID: null});
      this.props.relay.setVariables({selectedID: null});
    }
  }

}

export default Relay.createContainer(ConceptPage, {

  initialVariables: {selectedID: null, includeResults: false},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        user {
          id
        }
        selectedConcept: concept(id: $selectedID) {
          id
          name
          reqs { id }
          path {
            id
            name
          }
          ${ConceptBreadcrumbs.getFragment('concept')}
          ${ConceptCard.getFragment('concept')}
        }
        ${ConceptSimpleList.getFragment('viewer', {id: vars.selectedID})}
        ${SearchResults.getFragment('viewer').if(vars.includeResults)}
        ${ConceptForm.getFragment('viewer')}
        ${ConceptCard.getFragment('viewer')}
      }
    `
  }
});
