import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptList from './concept-list';
import ConceptInfo from './concept-info';

class Layout extends Component {

  state = {concept: null};

  render() {
    let {conceptRoot, concept} = this.props.viewer;

    let infoHTML = '';
    if (concept) infoHTML = <ConceptInfo concept={concept}/>;

    return (
      <div className="row">
        <div className="col-xs-4">
          <ConceptList concept={conceptRoot} onSelect={this.onSelect.bind(this)}
                       selectedId={this.props.relay.variables.selectedId}/>
        </div>
        <div className="col-xs-8">
          {infoHTML}
        </div>
      </div>
    );
  }

  onSelect(id) {
    this.props.relay.setVariables({selectedId: id});
  }

}

export default Relay.createContainer(Layout, {

  initialVariables: {selectedId: 'MUMBLEJUMBLE'},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on User {
        conceptRoot {
          ${ConceptList.getFragment('concept')}
        },
        concept(id: $selectedId) {
          ${ConceptInfo.getFragment('concept')}
        }
      }
    `
  }
});
