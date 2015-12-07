import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';
import _ from 'lodash';

import history from '../../history';
import DeleteConceptMutation from '../../mutations/concept/delete';
import DeleteExplanationMutation from '../../mutations/explanation/delete';
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
        {concept.path.length < 2 ? '' : (
          <div className="mdl-cell mdl-cell--12-col" style={{marginTop: 0}}>
            <ConceptBreadcrumbs concept={concept}/>
          </div>
        )}
        <CardAnimation>
          <div key="concept" className="mdl-card card-auto-fit"
               style={{overflow: 'visible'}}>
            <div className="mdl-card__title" style={{paddingBottom: 0}}>
              <h2 className="mdl-card__title-text">{name}</h2>
            </div>
            {this.renderReqs()}
            <div className="mdl-card__supporting-text" style={{paddingTop: 5}}>
              <div className="section-title">Summary</div>
              <div style={{whiteSpace: 'pre-wrap'}}>{summary}</div>
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
    if (!reqs.length) return;

    const borderStyle = '1px solid rgba(0, 0, 0, 0.1)';

    return (
      <div style={{paddingTop: 5}}>
        <div className="section-title">Requirements</div>
        {reqs.map(({id, name, summary, path}, i) => (
          <div key={id} className="mdl-card__supporting-text"
               style={{borderTop: borderStyle,
                       borderBottom: i + 1 == reqs.length ? borderStyle : 'none'}}>
            <h3 style={{fontSize: 22, margin: 0}}><Link to={pathToUrl(path)}>{name}</Link></h3>
            <div style={{whiteSpace: 'pre-wrap'}}>{summary}</div>
          </div>
        ))}
      </div>
    );
  }

  renderExplanations() {
    let {viewer, concept} = this.props;
    let {user} = viewer;
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
          {user ? (
            <div className="mdl-card__actions mdl-card--border">
              <Button onClick={this.onDeleteExplanation.bind(this, id)}>
                Delete
              </Button>
            </div>
          ) : ''}
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

  onDeleteExplanation(id) {
    if (!confirm('Do you really want to delete this explanation?')) return;
    Relay.Store.update(
      new DeleteExplanationMutation({id}),
      {
        onSuccess: t => {
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
          summary
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
