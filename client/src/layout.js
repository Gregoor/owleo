import React, {Component} from 'react';
import Relay from 'react-relay';

import SearchInput from './search-input';
import SearchResults from './search-results';
import ConceptList from './concept-list';
import ConceptInfo from './concept-info';

class Layout extends Component {

  state = {concept: null, query: null};

  componentWillMount() {
    if (this.props.path) this.setSelectedByPath(this.props.path);
  }

  componentWillReceiveProps(props) {
    if (props.path) this.setSelectedByPath(props.path);
  }

  setSelectedByPath(path) {
    this.props.relay.setVariables({selectedPath: path});
  }

  render() {
    let {viewer} = this.props;
    let {conceptRoot, concept} = viewer;
    let {query} = this.state;

    let list = query ?
      <SearchResults {...{viewer, query}}/> :
      <ConceptList concept={conceptRoot}
                   selectedPath={this.props.path.split('/')}/>;

    let conceptInfo = '';
    if (concept) conceptInfo = <ConceptInfo concept={concept}/>;

    return (
      <div className="row">

        <div className="col-xs-4" style={{padding: 0, backgroundColor: 'white'}}>

          <div className="col-xs-12" style={{boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'}}>
            <SearchInput onChange={this.onSearch.bind(this)}/>
          </div>

          <div className="col-xs-12" style={{height: '100%', marginTop: '5px', overflowY: 'scroll'}}>
            {list}
          </div>

        </div>

        <div className="col-xs-8">{conceptInfo}</div>

      </div>
    );
  }

  onSearch(event) {
    this.setState({query: event.target.value});
  }

}

export default Relay.createContainer(Layout, {

  initialVariables: {selectedPath: null},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on User {
        conceptRoot {
          ${ConceptList.getFragment('concept')}
        },
        concept(path: $selectedPath) {
          id,
          ${ConceptInfo.getFragment('concept')}
        },
        ${SearchResults.getFragment('viewer')}
      }
    `
  }
});
