import React, {Component} from 'react';
import Relay from 'react-relay';

import SearchResults from './results';
import ConceptBreadcrumbs from './breadcrumbs';
import ConceptList from './list';
import ConceptInfo from './info';
import ConceptForm from './form';
import ConceptMap from './map';

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
    let {showMap} = localStorage;

    let hasSelection = concept && selectedPath && this.state.selectedPath;

    let list;
    if (showMap) {
      list = <ConceptMap concept={conceptRoot}
                         selectedId={hasSelection ? concept.id : null}/>;
    } else if (query) {
      list = <SearchResults {...{viewer, query}} selectedId={concept.id}/>;
    } else {
      list = <ConceptList concept={conceptRoot}
                          selectedPath={selectedPath ? selectedPath.split('/') : null}
                          selectedId={concept.id}/>;
    }

    let content;
    if (showForm) {
      content = <ConceptForm {...{viewer}}
        onAbort={this._onCloseCreate.bind(this)} />;
    } else {
      content = hasSelection ? <ConceptInfo {...{concept}}/> : '';
    }

    return (
      <div className="mdl-grid" style={{padding: 0}}>

        <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch"
             style={{backgroundColor: 'white', margin: 0, width: '100%'}}>
          {hasSelection ? <ConceptBreadcrumbs {...{concept}}/> : ''}
        </div>

        <div className="mdl-cell mdl-cell--6-col mdl-cell--stretch"
             style={{margin: 0, backgroundColor: 'white'}}>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch"
               style={{
                height: '90%', marginTop: '5px',
                overflowY: showMap ? 'auto' : 'scroll'
               }}>
            {list}
          </div>
        </div>

        <div className="mdl-cell mdl-cell--6-col"
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
    this.setState({selectedPath});
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
          ${ConceptMap.getFragment('concept')}
        },
        concept(path: $selectedPath) {
          id,
          ${ConceptBreadcrumbs.getFragment('concept')}
          ${ConceptInfo.getFragment('concept')}
        },
        ${SearchResults.getFragment('viewer')},
        ${ConceptForm.getFragment('viewer')}
      }
    `
  }
});
