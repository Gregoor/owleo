import React, {Component} from 'react';
import Relay from 'react-relay';

import SearchInput from './../search/_input';
import SearchResults from './../search/_results';
import ConceptList from './_list';
import ConceptInfo from './_info';

class ConceptPage extends Component {

  state = {concept: null, query: null};

  componentWillMount() {
    this.setSelectedPath(this.props);
  }

  componentWillReceiveProps(props) {
    this.setSelectedPath(props);
  }

  setSelectedPath(props) {
    let {params} = props;
    let {path, splat} = params;
    let selectedPath = path + splat;
    if (!selectedPath || selectedPath == this.state.selectedPath) return;
    this.setState({selectedPath});
    this.props.relay.setVariables({selectedPath});
  }

  render() {
    let {viewer, relay} = this.props;
    let {conceptRoot, concept} = viewer;
    let {selectedPath} = relay.variables;
    let {query} = this.state;

    let list = query ?
      <SearchResults {...{viewer, query}}/> :
      <ConceptList concept={conceptRoot}
                   selectedPath={selectedPath ? selectedPath.split('/') : null}/>;

    let conceptInfo = '';
    if (concept && selectedPath) conceptInfo = <ConceptInfo concept={concept}/>;

    return (
      <div className="mdl-grid" style={{padding: 0}}>

        <div className="mdl-cell mdl-cell--4-col mdl-cell--stretch" style={{margin: 0, backgroundColor: 'white'}}>

          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch" style={{boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'}}>
            <SearchInput onChangeValue={this.onSearch.bind(this)}/>
          </div>

          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch" style={{height: '100%', marginTop: '5px', overflowY: 'scroll'}}>
            {list}
          </div>

        </div>

        <div className="mdl-cell mdl-cell--8-col">{conceptInfo}</div>

      </div>
    );
  }

  onSearch(query) {
    this.setState({query});
  }

}

export default Relay.createContainer(ConceptPage, {

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
