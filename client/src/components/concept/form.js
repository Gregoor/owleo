import React from 'react';
import Relay from 'react-relay';
import { Lifecycle } from 'react-router'
import {
  Button, Card, CardActions, CardText, CardTitle, Textfield
} from 'react-mdl';

import history from '../../history';
import ConceptSelect from './select/select';
import CreateConceptMutation from '../../mutations/concept/create';
import UpdateConceptMutation from '../../mutations/concept/update';

class ConceptForm extends React.Component {

  state = {summaryLength: 0};

  componentWillMount() {
    const {concept} = this.props;

    if (concept) this.setState({summaryLength: concept.summary.length});
  }

  render() {
    const {viewer, concept} = this.props;
    const {summaryLength} = this.state;

    let headline, buttonLabel;
    if (concept) {
      headline = `Update "${concept.name}"`;
      buttonLabel = 'Save';
    } else {
      headline = 'Create new concept';
      buttonLabel = 'Create';
    }


    let {name, container, reqs, summary, summarySource} = concept || {};
    return (
      <form onSubmit={this._handleSubmit.bind(this)}>
        <Card shadow={2}>
          <CardTitle>{headline}</CardTitle>
          <CardText>
            <Textfield ref="name" label="Name" floatingLabel
                       defaultValue={name}/>
            <ConceptSelect ref="container" name="container" label="Container"
                           {...{viewer}} defaultValue={[container]}/>
            <ConceptSelect ref="reqs" name="reqs" label="Requirements"
                           multi={true} {...{viewer}} defaultValue={reqs}/>
            <Textfield ref="summary" label="Summary" floatingLabel rows={3}
                      defaultValue={summary}
                      onChange={this._handleSummaryChange.bind(this)}/>
            <p style={summaryLength > 140 ? {color: 'red'} : {}}>
              {summaryLength} characters
            </p>

            <Textfield ref="summarySource" id="summarySrc"
                       label="Source of summary" defaultValue={summarySource}/>
          </CardText>
          <CardActions>
            <Button ripple onClick={this.props.onAbort}>
            Abort
            </Button>
            <Button type="submit" ripple primary>
              {buttonLabel}
            </Button>
          </CardActions>
        </Card>
      </form>
    );
  }

  _handleSummaryChange(event) {
    this.setState({summaryLength: event.target.value.length});
  }

  _handleSubmit(event) {
    event.preventDefault();
    const {name, container, reqs, summary, summarySource} = this.refs;
    const selectedContainer = container.refs.component.getSelected();
    const input = {
      name: name.getValue(),
      summary: summary.getValue(), summarySrc: summarySource.getValue(),
      container: selectedContainer ? selectedContainer.id : null,
      reqs: reqs.refs.component.getSelected().map(c => c.id)
    };

    const {concept} = this.props;
    const isNew = !concept;
    if (!isNew) input.id = concept.id;
    Relay.Store.update(
      isNew ? new CreateConceptMutation(input) : new UpdateConceptMutation(input),
      {
        onSuccess: t => {
          window.location = '/concepts?id=' +
            atob(isNew ? t.createConcept.conceptID : concept.id).split(':')[1];
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
