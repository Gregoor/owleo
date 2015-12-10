import React, {Component} from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';

import pathToUrl from '../../path-to-url';
import {Spinner} from '../mdl';

class SearchResults extends Component {

  state = {isTooShort: true, isLoading: false};

  componentWillReceiveProps(props) {
    let {query} = props;
    let isTooShort = query.length < 3;
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
          this.renderMessage('A search query must be at least 3 characters') :
          this.renderList()
        }
      </div>
    );
  }

  renderMessage(message) {
    return (
      <div style={{padding: '5px', paddingLeft: '10px'}}>
        <em>{message}</em>
      </div>
    );
  }

  renderList() {
    let {viewer, selectedId, onSelect} = this.props;
    let {concepts} = viewer;

    if (this.state.isLoading) return <Spinner/>;

    if (!concepts || concepts.length == 0) {
      return this.renderMessage(
        `No concepts with '${this.props.query}' in the title found`
      );
    }
    return (
      <ul style={{listStyleType: 'none', padding: '0 5'}}>
        {concepts.map(({path, name, summary}) => (
          <li style={{borderBottom: '1px solid rgba(0, 0, 0, 0.1)', overflow: 'hidden'}}>
            <Link className="mdl-js-ripple-effect" to={pathToUrl(path)}
                  onClick={onSelect} style={{
                    display: 'block', textDecoration: 'none',
                    color: 'black'
                  }}>
              <span style={{fontWeight: 200}}>
                {path.slice(1).reverse().map(({name}) =>
                  [<span>{name}</span>, ' > ']
                )}
              </span>
              <br/>
              <span style={{fontSize: 17}}>{name}</span>
              <div style={{fontWeight: 400}}>
                {summary}
              </div>
            </Link>
          </li>
        ))}
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
