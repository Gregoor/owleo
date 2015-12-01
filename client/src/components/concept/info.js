import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import DeleteConceptMutation from '../../mutations/concept/delete';
import pathToUrl from '../../path-to-url';
import {Button} from '../mdl';
import ConceptBreadcrumbs from './breadcrumbs';
import ConceptForm from './form';
import ExplanationForm from './explanation-form';

const YOUTUBE_REGEX = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
const getYouTubeIDFromURL = (url) => {
  let match = url.match(YOUTUBE_REGEX);
  return match && match[2].length == 11 ? match[2] : false;
};

const TRANSITION_DURATION = 700;
const CardAnimation = ({delay = 0, children}) => {
  let duration = TRANSITION_DURATION + delay;
  return (
    <ReactCSSTransitionGroup transitionName="card"
                             transitionEnterTimeout={duration}
                             transitionLeaveTimeout={duration}
                             transitionAppear={true}
                             transitionAppearTimeout={duration}>
      {children}
    </ReactCSSTransitionGroup>
  );
};

class ConceptInfo extends Component {

  render() {
    let {viewer, concept} = this.props;
    let {user} = viewer;
    if (this.props.relay.variables.includeForm) {
      return <ConceptForm {...{viewer, concept}}/>;
    }
    let {name, summary, reqs} = concept;
    return (
      <div>
        <div className="mdl-cell mdl-cell--12-col">
          <ConceptBreadcrumbs concept={concept}/>
        </div>
        <CardAnimation>
          <div key="concept" className="mdl-card mdl-shadow--2dp card-auto-fit">
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
    let {viewer, concept} = this.props;
    let delay = 0;
    let explanations = concept.explanations.edges.map(edge => {
      let {node: explanation} = edge;
      let {type, content} = explanation;

      let explanationContent;
      if (type == 'link') {
        let parser = document.createElement('a');
        parser.href = content;

        if (parser.hostname == 'youtu.be' || parser.host.includes('youtube')) {
          let id = getYouTubeIDFromURL(content);
          if (id) {
            explanationContent = (
              <iframe type="text/html" width="475" height="267"
                      src={`http://www.youtube.com/embed/${id}`}
                      frameborder="0"/>
            );
          }
        }

        if (!explanationContent) explanationContent = <a href={content}>{content}</a>
      } else {
        explanationContent = <div
          dangerouslySetInnerHTML={{__html: explanation.content}}/>
      }

      return (
        <div key={explanation.id} style={{transitionDelay: `${delay += 100}ms`}}
             className="mdl-card mdl-shadow--2dp card-auto-fit">
          <div className="mdl-card__supporting-text">
            {explanationContent}
          </div>
        </div>
      )
    });

    if (viewer.user) explanations.push(
      <div key="new" style={{transitionDelay: `${delay += 100}ms`}}>
        <ExplanationForm {...{concept}}/>
      </div>
    );
    return <CardAnimation delay={delay}>{explanations}</CardAnimation>;
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
        ${ConceptBreadcrumbs.getFragment('concept')}
        ${ExplanationForm.getFragment('concept')}
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
