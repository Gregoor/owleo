import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import clamp from 'clamp-js'
import {Card} from 'react-mdl';

import createConceptURL from '../../helpers/create-concept-url';
import {CenteredSpinner} from '../icons';

import './results.scss';

class ConceptResult extends React.Component {

  componentDidMount() {
    this._clampSummary();
  }

  componentDidUpdate() {
    this._clampSummary();
  }

  render() {
    const {concept, onSelect} = this.props;
    const {path, name, summary} = concept;
    return (
      <Card style={{marginBottom: 8, borderBottom: '1px solid rgba(0, 0, 0, 0.1)', padding: 10,
                  overflow: 'hidden'}}>
        <Link className="mdl-js-ripple-effect"
              to={createConceptURL(concept)}
              onClick={(event) => { onSelect(); }}
              style={{display: 'block', textDecoration: 'none', color: 'black'}}>
              <span style={{fontWeight: 200}}>
                {path.map(({name}) =>
                  [<span>{name}</span>, ' > ']
                )}
              </span>
          <br/>
          <span style={{fontSize: 17}}>{name}</span>
          <div ref="summary" style={{fontWeight: 400}}>
            {summary}
          </div>
        </Link>
      </Card>
    );
  }

  _clampSummary() {
    clamp(this.refs.summary, {clamp: 2});
  }

}

class SearchResults extends React.Component {

  state = {isLoading: false};

  componentDidMount() {
    this.props.relay.forceFetch();
  }

  componentWillReceiveProps(props) {
    const {query} = props;
    if (query == this.props.query) return;
    if (query.length >= 3) {
      this.setState({isLoading: true});
      this.props.relay.setVariables({query}, readyState => {
        if (readyState.done) this.setState({isLoading: false});
      });
    }
  }

  render() {
    const query = this.props.query;
    return (
      <div>
        {!query || query.length < 3 ?
          this._renderMessage('A search query must be at least 3 characters') :
          this._renderList()
        }
      </div>
    );
  }

  _renderMessage(message) {
    return (
      <div style={{padding: '5px', paddingLeft: '10px'}}>
        <em>{message}</em>
        <br/>
        <Link to="/">Take me back to the navigation</Link>
      </div>
    );
  }

  _renderList() {
    const {viewer: {concepts}, onSelect} = this.props;

    if (this.state.isLoading) return <CenteredSpinner/>;

    if (!concepts || concepts.length == 0) {
      return this._renderMessage(
        `No concepts with '${this.props.query}' in the title found`
      );
    }

    return concepts.map((concept) => (
      <ConceptResult key={concept.id} {...{concept, onSelect}}/>
    ));
  }

}

export default Relay.createContainer(SearchResults, {

  initialVariables: {query: ''},

  fragments: {
    viewer: () =>  Relay.QL`
      fragment on Viewer {
        concepts(query: $query) {
          id
          name
          mastered
          path {
            id
            name
          }
          summary
        }
      }
    `
  }

});
