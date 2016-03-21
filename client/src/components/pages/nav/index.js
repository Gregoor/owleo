import React from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';
import {Card, Cell, Grid, Spinner, Textfield} from 'react-mdl';

import fromGlobalID from '../../../helpers/from-global-id';
import createConceptURL from '../../../helpers/create-concept-url';
import ConceptSimpleList from './simple-list';
import SearchResults from './../../concept/results';
import ConceptCard from '../../concept/card/';
import ConceptForm from '../../concept/form';
import OwlPlaceholder from '../../owl-placeholder/';
import {CenteredSpinner} from '../../icons';
import CardAnimation from '../../card-animation';


class ConceptPage extends React.Component {

  state = {concept: null, query: ''};

  componentWillMount() {
    this._setSelected(this.props);
  }

  componentWillReceiveProps(props) {
    this._setSelected(props);
  }

  render() {
    const {location, viewer, relay: {variables: {selectedID}}} = this.props;
    let {selectedConcept} = viewer;
    const {query} = this.state;

    const hasSelection = selectedConcept && selectedID && this.state.selectedID;

    if (!hasSelection) {
      selectedConcept = {};
      document.title = 'Concepts';
    }

    let list;
    if (this.props.relay.variables.includeResults && query) {
      list = <SearchResults {...{viewer, query, selectedID}}
                            onSelect={this._clearSearch.bind(this)}/>;
    } else if (query || selectedID != location.query.id) {
      list = <CenteredSpinner style={{marginTop: 10}}/>;
    } else {
      list = <ConceptSimpleList viewer={viewer} id={selectedID}/>;
    }

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
      content = <ConceptCard key={selectedConcept.id} showReqs
                             {...{viewer, concept: selectedConcept}}/>;
      animateContent = true;
    } else {
      emptyOwl = true;
      content = <OwlPlaceholder/>
    }

    if (animateContent) content = <CardAnimation>{content}</CardAnimation>;

    return (
      <div className="concept-nav-container">

        <div className="nav-negative-margin">

          <Card className="concept-nav">
            <Grid style={{backgroundColor: 'white', margin: 0, padding: 0,
                          borderBottom: '1px solid rgba(0,0,0,0.5)'}}>
              <Cell col={12}>
                <Textfield ref="search" label="Search for concepts"
                           onChange={this._handleSearchChange.bind(this)}
                           onKeyUp={this._handleSearchKeyUp.bind(this)}
                           style={{margin: '-20px 0', width: '100%'}}/>
              </Cell>
            </Grid>
            <Cell col={12} align="stretch"
                  style={{width: '100%', margin: 0, overflowY: 'auto'}}>
            {list}
            </Cell>
          </Card>

          <div className="card-container concept-scroller">
            <div style={{marginTop: 10, marginBottom: 15}}>
              {contentLoading}
              {content}
            </div>
          </div>

        </div>

      </div>

    );
  }

  _handleSearchChange(event) {
    const {value: query} = event.target;
    this.props.relay.setVariables({includeResults: Boolean(query)});
    this.setState({query});
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

  _setSelected({viewer, location}) {
    const {selectedConcept} = viewer;
    const {id} = location.query;

    if (id && selectedConcept && selectedConcept.id && id == fromGlobalID(selectedConcept.id)) {
      const url = createConceptURL(selectedConcept);
      const {pathname, search} = this.props.location;
      if (pathname + search != url) this.props.history.replaceState('', url);
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
