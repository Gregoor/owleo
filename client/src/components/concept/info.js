import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';

import DeleteConceptMutation from '../../mutations/concept/delete';
import pathToUrl from '../../path-to-url';
import {Button} from '../mdl';
import ConceptForm from './form';
import ExplanationForm from './explanation-form';

class ConceptInfo extends Component {

  render() {
    let {viewer, concept} = this.props;
    if (this.props.relay.variables.includeForm) {
      return <ConceptForm {...{viewer, concept}}/>;
    }
    let {name, summary, reqs} = concept;
    return (
      <div>
        <div className="mdl-card mdl-shadow--2dp card-auto-fit">
          <div className="mdl-card__title" style={{paddingBottom: 0}}>
            <h2 className="mdl-card__title-text">{name}</h2>
          </div>
          <div className="mdl-card__supporting-text" style={{paddingTop: 5}}>
            {this.renderReqs()}
            <p style={{paddingTop: 10}}>{summary}</p>
          </div>
          <div className="mdl-card__menu">
            <Button buttonType={['icon', 'accent']}>
              <i className="material-icons">school</i>
            </Button>
          </div>
          <div className="mdl-card__actions mdl-card--border">
            <Button onClick={this.onDelete.bind(this)}>
              Delete
            </Button>
            <Button onClick={this.onEdit.bind(this)}>
              Edit
            </Button>
          </div>
        </div>
        {this.renderExplanations()}
      </div>
    );
  }

  renderReqs() {
    let {reqs} = this.props.concept;
    return (
      <div>
        {reqs.length ? <em>Requires:</em> : ''}
        {reqs.map(req => (
          <Link key={req.id} to={pathToUrl(req.path)} style={{padding: '3px'}}>
            {req.name}
          </Link>
        ))}
      </div>
    );
  }

  renderExplanations() {
    let {concept} = this.props;
    return [
      ...concept.explanations.edges.map(edge => {
        let {node: explanation} = edge;

        let {type, content} = explanation;
        return (
          <div key={explanation.id}
               className="mdl-card mdl-shadow--2dp card-auto-fit">
            <div className="mdl-card__supporting-text">
              {type == 'link' ? <a href={content}>{content}</a> :
                <div dangerouslySetInnerHTML={{__html: explanation.content}}/>}
            </div>
          </div>
        )
      }),
      <ExplanationForm key="new" {...{concept}}/>
    ];
  }

  onDelete() {
    let {concept} = this.props;
    if (!confirm(`Do you really want to delete "${concept.name}"?`)) return;

    Relay.Store.update(
      new DeleteConceptMutation({conceptId: concept.id}),
      {
        onSuccess: t => {
          location.hash = '/concepts';
          location.reload();
        },
        onFailure: t => console.error(t.getError().source.errors)
      }
    );
  }

  onEdit() {
    this.props.relay.setVariables({includeForm: true});
  }

}

export default Relay.createContainer(ConceptInfo, {

  initialVariables: {includeForm: false},

  fragments: {
    viewer: (variables) => Relay.QL`
      fragment on Viewer {
        user {
          id
        }
        ${ConceptForm.getFragment('viewer').if(variables.includeForm)}
      }
    `,
    concept: (variables) => Relay.QL`
      fragment on Concept {
        ${ExplanationForm.getFragment('concept')}
        id,
        name,
        summary,
        reqs {
          id,
          name,
          path {
            name
          }
        },
        explanations(first: 10) {
          edges {
            node {
              id,
              type,
              content
            }
          }
        }
        ${ConceptForm.getFragment('concept').if(variables.includeForm)}
      }
    `
  }

});
