import React, {Component} from 'react';
import Relay from 'react-relay';

import {TextField, TextArea} from '../mdl';
import ConceptSelect from './select.js';
import CreateConceptMutation from '../../mutations/create-concept-mutation';

class ConceptForm extends Component {

  render() {
    let {viewer} = this.props;
    return (
      <form onSubmit={this._onSubmit.bind(this)}>
        <div className="mdl-card mdl-shadow--2dp card-auto-fit">
          <div className="mdl-card__title">
            <h2 className="mdl-card__title-text">Create new concept</h2>
          </div>
          <div className="mdl-card__supporting-text">
            <TextField ref="name" id="name" label="Name"/>
            <ConceptSelect ref="container" name="container" label="Container"
                           {...{viewer}}/>
            <ConceptSelect ref="reqs" name="reqs" label="Requirements"
                           multi={true} {...{viewer}}/>
            <TextArea ref="summary" id="summary" label="Summary"/>
            <TextField ref="summarySource" id="summarySrc"
                       label="Source of summary"/>
          </div>
          <div className="mdl-card__actions mdl-card--border">
            <button type="buton" onClick={this.props.onAbort}
                    className="mdl-button mdl-js-button mdl-js-ripple-effect">
            Abort
            </button>
            <button type="submit" className="mdl-button mdl-button--colored
                                    mdl-js-button mdl-js-ripple-effect">
              Create
            </button>
          </div>
        </div>
      </form>
    );
  }

  _onSubmit(event) {
    event.preventDefault();
    let {name, container, reqs, summary, summarySource} = this.refs;
    let selectedContainer = container.refs.component.getSelected();
    Relay.Store.update(
      new CreateConceptMutation({
        name: name.getValue(),
        summary: summary.getValue(), summarySrc: summarySource.getValue(),
        container: selectedContainer ? selectedContainer.id : null,
        reqs: reqs.refs.component.getSelected().map(c => c.id)
        }),
      {
        onSuccess: t => console.log('fuck yeah', t),
        onFailure: t => console.error(t.getError().source.errors)
      }
    );
  }

}

export default Relay.createContainer(ConceptForm, {

  fragments: {
    viewer: () =>  Relay.QL`
      fragment on Viewer {
        ${ConceptSelect.getFragment('viewer')}
      }
    `
  }

});
