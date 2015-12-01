import React, {Component} from 'react';
import Relay from 'react-relay';
import { Lifecycle } from 'react-router'

import history from '../../history';
import {Button, TextField, TextArea} from '../mdl';
import ConceptSelect from './select/select';
import CreateConceptMutation from '../../mutations/concept/create';
import UpdateConceptMutation from '../../mutations/concept/update';

class ConceptForm extends Component {

  render() {
    let {viewer, concept} = this.props;

    let headline, buttonLabel;
    if (concept) {
      headline = `Update "${concept.name}"`;
      buttonLabel = 'Save';
    } else {
      headline = 'Create new concept';
      buttonLabel = 'Create;'
    }


    let {name, container, reqs, summary, summarySource} = concept || {};
    return (
      <form onSubmit={this._onSubmit.bind(this)}>
        <div className="mdl-card mdl-shadow--2dp card-auto-fit">
          <div className="mdl-card__title">
            <h2 className="mdl-card__title-text">{headline}</h2>
          </div>
          <div className="mdl-card__supporting-text">
            <TextField ref="name" id="name" label="Name" defaultValue={name}/>
            <ConceptSelect ref="container" name="container" label="Container"
                           {...{viewer}} defaultValue={[container]}/>
            <ConceptSelect ref="reqs" name="reqs" label="Requirements"
                           multi={true} {...{viewer}} defaultValue={reqs}/>
            <TextArea ref="summary" id="summary" label="Summary"
                      defaultValue={summary}/>
            <TextField ref="summarySource" id="summarySrc"
                       label="Source of summary" defaultValue={summarySource}/>
          </div>
          <div className="mdl-card__actions mdl-card--border">
            <Button type="button" onClick={this.props.onAbort}>
            Abort
            </Button>
            <Button type="submit" buttonType="primary">
              {buttonLabel}
            </Button>
          </div>
        </div>
      </form>
    );
  }

  _onSubmit(event) {
    event.preventDefault();
    let {name, container, reqs, summary, summarySource} = this.refs;
    let selectedContainer = container.refs.component.getSelected();
    let input = {
      name: name.getValue(),
      summary: summary.getValue(), summarySrc: summarySource.getValue(),
      container: selectedContainer ? selectedContainer.id : null,
      reqs: reqs.refs.component.getSelected().map(c => c.id)
    };

    let {concept} = this.props;
    let isNew = !concept;
    if (!isNew) input.id = concept.id;
    Relay.Store.update(
      isNew ? new CreateConceptMutation(input) : new UpdateConceptMutation(input),
      {
        onSuccess: t => {
          history.pushState(null,
            'id/' + (isNew ? t.createConcept.conceptId : concept.id)
          );
          location.reload();
        },
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
    `,
    concept: () => Relay.QL`
      fragment on Concept {
        id,
        name,
        summary,
        summarySource,
        container {
          id,
          name
        },
        reqs {
          id,
          name
        }
      }
    `
  }

});
