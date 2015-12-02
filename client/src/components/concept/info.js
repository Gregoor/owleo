import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';
import _ from 'lodash';

import history from '../../history';
import DeleteConceptMutation from '../../mutations/concept/delete';
import pathToUrl from '../../path-to-url';
import ConceptBreadcrumbs from './breadcrumbs';
import ConceptForm from './form';
import ExplanationContent from './explanation-content';
import ExplanationForm from './explanation-form';
import CardAnimation from '../card-animation';
import {Button} from '../mdl';

class ConceptInfo extends Component {

  componentDidMount() {
    document.title = this.props.concept.name;
  }

  render() {
    let {viewer, concept} = this.props;
    let {user} = viewer;
    if (this.props.relay.variables.includeForm) {
      return <ConceptForm {...{viewer, concept}}/>;
    }
    let {id, name, summary, reqs, path} = concept;
    return (
      <div style={{margin: '0 auto', width: '100%', maxWidth: '700px'}}>
        <div className="mdl-cell mdl-cell--12-col">
          <ConceptBreadcrumbs concept={concept}/>
        </div>
        <CardAnimation>
          <div key="concept" className="mdl-card card-auto-fit"
               style={{overflow: 'visible'}}>
            <div className="mdl-card__title" style={{paddingBottom: 0}}>
              <h2 className="mdl-card__title-text">{name}</h2>
            </div>
            <div className="mdl-card__supporting-text" style={{paddingTop: 5}}>
              {this.renderReqs()}
              <div style={{marginTop: 15}}>{summary}</div>
            </div>
            {_.isEmpty(reqs.length) && path.length == 1 ? '' : (
              <div className="mdl-card__menu">
                <Button id="learn" to={'/learn/' + id}
                        buttonType={['icon', 'accent']}>
                  <i className="material-icons">school</i>
                </Button>
                <div className="mdl-tooltip" htmlFor="learn">
                  Start mastering this concept
                </div>
              </div>
            )}
            {user ? (
              <div className="mdl-card__actions mdl-card--border">
                <Button onClick={this.onDelete.bind(this)}>
                  Delete
                </Button>
                <Button onClick={this.onEdit.bind(this)}>
                  Edit
                </Button>
              </div>
            ) : ''}
          </div>
        </CardAnimation>
        {this.renderExplanations()}
      </div>
    );
  }

  renderReqs() {
    let {reqs} = this.props.concept;
    return (
      <div>
        {reqs.length ? <em>Requirements:</em> : ''}
        {reqs.map(req => (
          <Link key={req.id} to={pathToUrl(req.path)} style={{padding: '10px'}}>
            {req.name}
          </Link>
        ))}
      </div>
    );
  }

  renderExplanations() {
    let {viewer, concept} = this.props;
    let delay = 0;
    let explanations = concept.explanations.edges.map(edge => {
      let {node: explanation} = edge;

      let {id, type} = explanation;
      return (
        <div key={id} style={{marginBottom: 8, transitionDelay: `${delay += 100}ms`}}
             className="mdl-card card-auto-fit">
          <div className="mdl-card__supporting-text"
               style={type == 'link' ? {width: '100%', padding: 0} : {}}>
            <ExplanationContent explanation={explanation}/>
          </div>
        </div>
      )
    });

    if (viewer.user) explanations.push(
      <div key="new" style={{transitionDelay: `${delay += 100}ms`}}>
        <ExplanationForm {...{concept}}/>
      </div>
    );

    if (_.isEmpty(explanations)) return;

    return (
      <CardAnimation delay={delay}>
        <h4>Explanations</h4>{explanations}
      </CardAnimation>
    );
  }

  onDelete() {
    let {concept} = this.props;
    if (!confirm(`Do you really want to delete "${concept.name}"?`)) return;

    Relay.Store.update(
      new DeleteConceptMutation({conceptId: concept.id}),
      {
        onSuccess: t => {
          history.pushState(null, '/concepts');
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
        id
        name
        summary
        path {name}
        reqs {
          id
          name
          path {
            name
          }
        },
        ${ConceptBreadcrumbs.getFragment('concept')}
        ${ExplanationForm.getFragment('concept')}
        explanations(first: 10) {
          edges {
            node {
              id
              type
              ${ExplanationContent.getFragment('explanation')}
            }
          }
        }
        ${ConceptForm.getFragment('concept').if(variables.includeForm)}
      }
    `
  }

});
