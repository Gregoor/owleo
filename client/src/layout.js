import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptList from './concept-list';
import ConceptInfo from './concept-info';

class Layout extends Component {

  state = {concept: null};

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
    let {conceptRoot, concept} = this.props.viewer;

    let infoHTML = '';
    if (concept) infoHTML = <ConceptInfo concept={concept}/>;

    return (
      <div className="row">
        <div className="col-xs-4">
          <div style={{height: '99.8%', overflowY: 'scroll'}}>
            <ConceptList concept={conceptRoot}
                         selectedPath={this.props.path.split('/')}/>
          </div>
        </div>
        <div className="col-xs-8">
          {infoHTML}
        </div>
      </div>
    );
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
        }
      }
    `
  }
});
