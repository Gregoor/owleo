import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import {DataTable, Button, Spinner} from 'react-mdl';
import _ from 'lodash';

import MasterConceptsMutation from '../../mutations/concept/master';
import ConceptBreadcrumbs from './breadcrumbs';
import 'dialog-polyfill';

import './mdl-dialog.scss';

class LearnConceptDialog extends React.Component {

  state = {isLoadingReqs: false};

  componentWillMount() {
    const {id, mastered} = this.props.concept;
    if (!mastered) {
      this.setState({isLoadingReqs: true});
      this.props.relay.setVariables({id}, (readyState) => {
        if (readyState.done) this.setState({isLoadingReqs: false});
      });
    }
  }

  componentDidMount() {
    const {dialog} = this.refs;
    if (!dialog.showModal) window.dialogPolyfill.registerDialog(dialog);
    dialog.showModal();
    dialog.onclose = this._handleClose.bind(this);
  }

  render() {
    const {concept, viewer} = this.props;
    const {learnPath} = viewer;
    const {mastered} = concept;

    let content;
    if (this.state.isLoadingReqs) {
      content = (
        <div style={{display: 'flex', justifyContent: 'center',
                     overflow: 'hidden'}}>
          <Spinner/>
        </div>
      );
    } else if (learnPath && learnPath.length == 1) {
      content = (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Button onClick={this._handleMasterAll.bind(this)}>
            Mark this concept as mastered
          </Button>
        </div>
      );
    } else if (!mastered) {
      const rows = (learnPath || [])
        .map((concept) => ({
          name: (
            <Link to="/concepts" query={{id: atob(concept.id).split(':')[1]}}
                  style={{fontSize: 17}}>
              {concept.name}
            </Link>
          ),
          path: concept.path.length > 1 ?
            <ConceptBreadcrumbs concept={concept} hideLeaf/> :
            <em>None</em>
        }));


      const table = (
        <DataTable
          columns={[
          {name: 'name', label: 'Name'},
          {name: 'path', label: 'Container(s)'}
        ]}
          rows={rows}/>
      );

      content = (
        <div>
          If you want to mark this concept as mastered, without going into learn
          mode, you also have mark its requirements as mastered.
          <br/>
          <span className="color-text--invalid">
            It is recommended that you only do this if you fully grasp every
            concept listed. When in doubt, just go into learn mode and refresh
            your memory.
          </span>
          <div style={{maxHeight: 250, marginTop: 10, overflow: 'auto'}}>
            {table}
          </div>
          <br/>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Button onClick={this._handleMasterAll.bind(this)}>
              Mark these concept as mastered
            </Button>
          </div>
        </div>
      );
    }

    return (
      <dialog ref="dialog" className="mdl-dialog"
              style={{maxWidth: 700, width: '100%', fontSize: 19}}>
        <div className="mdl-dialog__content">
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Link to={'/learn/' + concept.id}>
              <Button primary>
                {mastered ? 'Learn again about' : 'Start learning about'}&nbsp;
                <b>{concept.name}</b>
              </Button>
            </Link>
          </div>
          <br/>
          {content}
        </div>
        <div className="mdl-dialog__actions">
          <Button onClick={this._handleClose.bind(this)}>Close</Button>
        </div>
      </dialog>
    )
  }

  _handleMasterAll() {
    Relay.Store.update(new MasterConceptsMutation({
      conceptIDs: _.pluck(this.props.viewer.learnPath, 'id'),
      mastered: true
    }));
  }

  _handleClose() {
    const {dialog} = this.refs;
    if (dialog.open) dialog.close();
    this.props.onClose();
  }

}

LearnConceptDialog.defaultProps = {onClose: _.noop};

export default Relay.createContainer(LearnConceptDialog, {

  initialVariables: {id: null},

  fragments: {

    viewer: () => Relay.QL`
      fragment on Viewer {
        learnPath(targetId: $id, mastered: false) {
          id
          name
          path { name }
          ${ConceptBreadcrumbs.getFragment('concept')}
        }
      }
    `,

    concept: () => Relay.QL`
      fragment on Concept {
        id
        name
        mastered
      }
    `

  }

})
