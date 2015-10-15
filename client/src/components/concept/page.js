import React, {Component} from 'react';
import Relay from 'react-relay';

import SearchResults from './results';
import ConceptList from './list';
import ConceptInfo from './info';
import ConceptForm from './form';

class ConceptPage extends Component {

  state = {concept: null, showForm: false};

  componentWillMount() {
    this._setSelectedPath(this.props);
  }

  componentWillReceiveProps(props) {
    this._setSelectedPath(props);
  }

  render() {
    let {viewer, relay, query} = this.props;
    let {conceptRoot, concept} = viewer;
    let {selectedPath} = relay.variables;
    let {showForm} = this.state;

    let list = query ?
      <SearchResults {...{viewer, query}} selectedId={concept.id}/> :
      <ConceptList concept={conceptRoot}
                   selectedPath={selectedPath ? selectedPath.split('/') : null}
                   selectedId={concept.id}/>;

    let content;
    if (showForm) {
      content = <ConceptForm {...{viewer}}
        onAbort={this._onCloseCreate.bind(this)} />;
    } else if (concept && selectedPath && this.state.selectedPath) {
      content = <ConceptInfo {...{concept}}/>;
    } else {
      content = '';
    }

    return (
      <div className="mdl-grid" style={{padding: 0}}>

        <div className="mdl-cell mdl-cell--4-col mdl-cell--stretch"
             style={{margin: 0, backgroundColor: 'white'}}>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch"
               style={{height: '100%', marginTop: '5px', overflowY: 'scroll'}}>
            {list}
          </div>
        </div>

        <div className="mdl-cell mdl-cell--8-col"
             style={{maxWidth: 512/*330*/, margin: '10px auto'}}>
          {content}
        </div>

        <button style={{position: 'fixed', right: 30, bottom: 30}}
                className="mdl-button mdl-js-button mdl-button--fab
                           mdl-js-ripple-effect mdl-button--colored"
                onClick={this._onOpenCreate.bind(this)}>
          <i className="material-icons">add</i>
        </button>

      </div>
    );
  }

  _setSelectedPath(props) {
    let {params, query} = props;
    let {path, splat} = params;
    let selectedPath = path + splat;
    this.setState({selectedPath: selectedPath});
    if (!selectedPath || selectedPath == this.state.selectedPath) return;
    this.props.relay.setVariables({selectedPath});
  }

  _onOpenCreate() {
    this.setState({showForm: true});
  }

  _onCloseCreate() {
    this.setState({showForm: false});
  }

}

export default Relay.createContainer(ConceptPage, {

  initialVariables: {selectedPath: null},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        conceptRoot {
          ${ConceptList.getFragment('concept')}
        },
        concept(path: $selectedPath) {
          id,
          ${ConceptInfo.getFragment('concept')}
        },
        ${SearchResults.getFragment('viewer')},
        ${ConceptForm.getFragment('viewer')}
      }
    `
  }
});
