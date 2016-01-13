import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import clamp from 'clamp-js'
import {Spinner} from 'react-mdl';

import createConceptURL from '../../helpers/create-concept-url';

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
      <li style={{borderBottom: '1px solid rgba(0, 0, 0, 0.1)', padding: 10,
                  overflow: 'hidden'}}>
        <Link className="mdl-js-ripple-effect" to={createConceptURL(concept)}
              onClick={(event) => { onSelect(); }}
              style={{display: 'block', textDecoration: 'none', color: 'black'}}>
              <span style={{fontWeight: 200}}>
                {path.slice(1).reverse().map(({name}) =>
                  [<span>{name}</span>, ' > ']
                )}
              </span>
          <br/>
          <span style={{fontSize: 17}}>{name}</span>
          <div ref="summary" style={{fontWeight: 400}}>
            {summary}
          </div>
        </Link>
      </li>
    );
  }

  _clampSummary() {
    clamp(this.refs.summary, {clamp: 2});
  }

}

class SearchResults extends React.Component {

  state = {isTooShort: true, isLoading: false};

  componentWillReceiveProps(props) {
    const {query} = props;
    if (query == this.props.query) return;
    const isTooShort = query.length < 3;
    if (!isTooShort) {
      this.setState({isLoading: true});
      this.props.relay.forceFetch({query}, readyState => {
        if (readyState.done) this.setState({isLoading: false});
      });
    }
    this.setState({isTooShort})
  }

  render() {
    return (
      <div>
        {this.state.isTooShort ?
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
      </div>
    );
  }

  _renderList() {
    const {viewer, onSelect} = this.props;
    const {concepts} = viewer;

    if (this.state.isLoading) return <Spinner/>;

    if (!concepts || concepts.length == 0) {
      return this._renderMessage(
        `No concepts with '${this.props.query}' in the title found`
      );
    }
    return (
      <ul style={{listStyleType: 'none', margin: 0, padding: '0 5'}}>
        {concepts.map((concept) => {
          return <ConceptResult key={concept.id} {...{concept, onSelect}}/>;
        })}
      </ul>
    );
  }

}

export default Relay.createContainer(SearchResults, {

  initialVariables: {query: null},

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
