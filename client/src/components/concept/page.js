import React, {Component} from 'react';
import Relay from 'react-relay';

import SearchResults from './results';
import ConceptList from './list';
import ConceptInfo from './info';

class ConceptPage extends Component {

  state = {concept: null};

  componentWillMount() {
    this.setSelectedPath(this.props);
  }

  componentWillReceiveProps(props) {
    this.setSelectedPath(props);
  }

  setSelectedPath(props) {
    let {params, query} = props;
    let {path, splat} = params;
    let selectedPath = path + splat;
    this.setState({selectedPath: selectedPath});
    if (!selectedPath || selectedPath == this.state.selectedPath) return;
    this.props.relay.setVariables({selectedPath});
  }

  render() {
    let {viewer, relay, query} = this.props;
    let {conceptRoot, concept} = viewer;
    let {selectedPath} = relay.variables;

    let list = query ?
      <SearchResults {...{viewer, query}} selectedId={concept.id}/> :
      <ConceptList concept={conceptRoot}
                   selectedPath={selectedPath ? selectedPath.split('/') : null}
                   selectedId={concept.id}/>;

    let conceptInfo = concept && selectedPath && this.state.selectedPath ?
      <ConceptInfo {...{concept}}/> : '';

    return (
      <div className="mdl-grid" style={{padding: 0}}>

        <div className="mdl-cell mdl-cell--4-col mdl-cell--stretch"
             style={{margin: 0, backgroundColor: 'white'}}>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch"
               style={{height: '100%', marginTop: '5px', overflowY: 'scroll'}}>
            {list}
          </div>
        </div>

        <div className="mdl-cell mdl-cell--8-col">{conceptInfo}</div>

      </div>
    );
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
