import React, {Component} from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';

import SearchResults from './results';
import ConceptBreadcrumbs from './breadcrumbs';
import ConceptList from './list';
import ConceptInfo from './info';
import ConceptForm from './form';
import ConceptMap from './map';
import {pathToUrl} from '../../helpers';

class ConceptPage extends Component {

  state = {concept: null};

  componentWillMount() {
    this._setSelectedPath(this.props);
  }

  componentWillReceiveProps(props) {
    this._setSelectedPath(props);
  }

  render() {
    let {viewer, relay, query, navType} = this.props;
    let {conceptRoot, concept} = viewer;
    let {selectedPath, selectedId} = relay.variables;

    let hasSelection = concept && (selectedId && this.state.selectedId) ||
      (selectedPath && this.state.selectedPath);

    if (!concept) concept = {};
    let list;
    if (navType == 'map') {
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
    if (this.props.children) {
      content = React.cloneElement(this.props.children, {viewer});
    } else {
      content = hasSelection ? <ConceptInfo {...{concept}}/> : '';
    }

    return (
      <div className="mdl-grid" style={{padding: 0, height: '90%',
                                        marginTop: '11px', maxWidth: '1300px'}}>

        <div className="mdl-cell mdl-cell--6-col mdl-cell--stretch mdl-shadow--2dp"
             style={{maxWidth: navType == 'map' ? '800px' : '500px', margin: 0, backgroundColor: 'white'}}>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch"
               style={{backgroundColor: 'white', margin: 0, width: '100%',
                        borderBottom: '1px solid rgba(0,0,0,0.5)'}}>
            <ConceptBreadcrumbs concept={hasSelection ? concept : null}/>
          </div>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--stretch"
               style={{
                height: '92.5%', marginTop: '5px',
                overflowY: navType == 'map' ? 'auto' : 'scroll'
               }}>
            {list}
          </div>
        </div>

        <div className="mdl-cell mdl-cell--6-col"
             style={{maxWidth: 512/*330*/, margin: '0 auto'}}>
          {content}
        </div>

        <Link style={{position: 'fixed', right: 30, bottom: 30}}
                className="mdl-button mdl-js-button mdl-button--fab
                           mdl-js-ripple-effect mdl-button--colored"
                to="/concepts/new">
          <i className="material-icons">add</i>
        </Link>

      </div>
    );
  }

  _setSelectedPath(props) {
    let {params} = props;
    let {id, path, splat} = params;

    let {concept} = props.viewer;
    if (id && id == concept.id) {
      this.props.history.replaceState('', pathToUrl(concept.path));
    }
    if (id) {
      this.setState({selectedId: id, selectedPath: null});
      if (id == this.state.selectedId) return;
      this.props.relay.setVariables({selectedId: id, selectedPath: null});
    } else {
      let selectedPath = path + splat;
      this.setState({selectedPath, selectedId: null});
      if (!selectedPath || selectedPath == this.state.selectedPath) return;
      this.props.relay.setVariables({selectedPath, selectedId: null});
    }
  }

}

export default Relay.createContainer(ConceptPage, {

  initialVariables: {selectedPath: null, selectedId: null},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        conceptRoot {
          ${ConceptList.getFragment('concept')}
          ${ConceptMap.getFragment('concept')}
        },
        concept(path: $selectedPath, id: $selectedId) {
          id,
          path {
            name
          }
          ${ConceptBreadcrumbs.getFragment('concept')}
          ${ConceptInfo.getFragment('concept')}
        },
        ${SearchResults.getFragment('viewer')}
        ${ConceptForm.getFragment('viewer')}
      }
    `
  }
});
