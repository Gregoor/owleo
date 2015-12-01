import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import _ from 'lodash';

import history from '../../history';
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

  componentDidMount() {
    document.title = this.props.concept.name;
    window.iframely.load();
  }

  componentDidUpdate() {
    window.iframely.load();
  }

  render() {
    let {viewer, concept, learnMode} = this.props;
    let {user} = viewer;
    if (this.props.relay.variables.includeForm) {
      return <ConceptForm {...{viewer, concept}}/>;
    }
    let {id, name, summary, reqs, path} = concept;
    return (
      <div style={{margin: '0 auto'}}>
        <div style={{maxWidth: 512}}>
          <div className="mdl-cell mdl-cell--12-col">
            <ConceptBreadcrumbs concept={concept}/>
          </div>
          <CardAnimation>
            <div key="concept" className="mdl-card mdl-shadow--2dp card-auto-fit"
                 style={{overflow: 'visible'}}>
              <div className="mdl-card__title" style={{paddingBottom: 0}}>
                <h2 className="mdl-card__title-text">{name}</h2>
              </div>
              <div className="mdl-card__supporting-text" style={{paddingTop: 5}}>
                {this.renderReqs()}
                <p style={{paddingTop: 10}}>{summary}</p>
              </div>
              {learnMode || (_.isEmpty(reqs.length) && path.length == 1) ? '' : (
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
    let {viewer, concept} = this.props;
    let delay = 0;
    let explanations = concept.explanations.edges.map(edge => {
      let {node: explanation} = edge;
      let {type, content} = explanation;

      let explanationContent, style;
      if (type == 'link') {
        explanationContent = <a data-iframely-url href={content}>{content}</a>;
        style = {padding: 0, width: '100%'};
      } else {
        explanationContent = <div
          dangerouslySetInnerHTML={{__html: explanation.content}}/>
      }

      return (
        <div key={explanation.id} style={{transitionDelay: `${delay += 100}ms`}}
             className="mdl-card mdl-shadow--2dp card-auto-fit">
          <div className="mdl-card__supporting-text" style={style}>
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
              content
            }
          }
        }
        ${ConceptForm.getFragment('concept').if(variables.includeForm)}
      }
    `
  }

});
