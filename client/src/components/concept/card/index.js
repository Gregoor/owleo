import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import _ from 'lodash';
import {
  Card, CardMenu, CardText, CardTitle, Cell, FABButton, IconButton,
  Menu, MenuItem
} from 'react-mdl';

import history from '../../../history';
import DeleteConceptMutation from '../../../mutations/concept/delete';
import Req from './req';
import ConceptBreadcrumbs from './../breadcrumbs';
import LearnConceptButton from '../learn-button';
import MasterConceptButton from '../master-button';
import ConceptForm from './../form';
import ExplanationList from '../../explanation/list';
import CardAnimation from '../../card-animation';
import shortenURL from '../../../helpers/shorten-url';

class ConceptCard extends React.Component {

  componentDidMount() {
    document.title = this.props.concept.name;
  }

  render() {
    const {viewer, concept, showMasterButton, showReqs} = this.props;
    const {user} = viewer;
    if (this.props.relay.variables.includeForm) {
      return <ConceptForm {...{viewer, concept}}
          onAbort={() => this.props.relay.setVariables({includeForm: false})}/>;
    }
    const {id, name, summary, summarySource, reqs} = concept;
    return (
      <div style={{margin: '0 auto'}}>
        {concept.path.length < 2 ? <div style={{height: 28}}/> : (
          <Cell col={12}>
            <ConceptBreadcrumbs concept={concept}/>
          </Cell>
        )}
        <div style={{height: 25}}/>
        <CardAnimation>
          <Card key="concept" style={{overflow: 'visible'}}>
            <CardTitle style={{paddingBottom: 0}}>
              {this.props.nameAsLink ?
                (
                  <Link to="/concepts" query={{id: atob(id).split(':')[1]}}
                        style={{fontSize: 28}}>
                    {name}
                  </Link>
                ) :
                name
              }
            </CardTitle>
            <CardMenu>
              {showMasterButton ?
                <MasterConceptButton {...{concept}}
                                     onMaster={this.props.onMaster}
                                     style={{marginTop: -45}}/>:
                <LearnConceptButton {...{concept, viewer}}
                                    style={{marginTop: -45}}/>
              }
              {user && user.admin ? (
                <div>
                  <IconButton name="more_vert" id="concept-menu"
                              style={{marginLeft: 24}}/>
                  <Menu target="concept-menu">
                    <MenuItem ripple onClick={this._handleEdit.bind(this)}>
                      Edit
                    </MenuItem>
                    <MenuItem ripple onClick={this._handleDelete.bind(this)}>
                      Delete
                    </MenuItem>
                  </Menu>
                </div>
              ) : ''}
            </CardMenu>
            {!showReqs || _.isEmpty(reqs) ? '' :
              <div style={{paddingTop: 5}}>
                <div className="section-title">Requirements</div>
                {reqs.map((concept, i) => (
                  <Req key={concept.id} concept={concept}
                       isLast={i + 1 == reqs.length}/>
                ))}
              </div>
            }
            <CardText style={{paddingTop: 5}}>
              <div className="section-title">Summary</div>
              {summarySource ?
                <div>
                  <blockquote>{summary}</blockquote>
                  <em>Source:</em>&nbsp;
                  <a href={summarySource} target="_blank">
                    {summarySource.length > 60 ?
                      shortenURL(summarySource) :
                      summarySource}
                  </a>
                </div> :
                <div style={{whiteSpace: 'pre-wrap'}}>{summary}</div>
              }
            </CardText>
          </Card>
        </CardAnimation>
        <ExplanationList {...{user, concept}} />
      </div>
    );
  }

  _handleDelete() {
    const {concept} = this.props;
    if (!confirm(`Do you really want to delete "${concept.name}"?`)) return;

    Relay.Store.update(new DeleteConceptMutation({concept}),
      {
        onSuccess: (t) => {
          history.pushState(null, '/concepts');
          location.reload();
        },
        onFailure: (t) => console.error(t.getError().source.errors)
      }
    );
  }

  _handleEdit() {
    this.props.relay.setVariables({includeForm: true});
  }

}

ConceptCard.defaultProps = {
  showReqs: false, showMasterButton: false, nameAsLink: false, onMaster: _.noop
};

export default Relay.createContainer(ConceptCard, {

  initialVariables: {includeForm: false},

  fragments: {
    viewer: (variables) => Relay.QL`
      fragment on Viewer {
        user {
          id
          admin
          ${ExplanationList.getFragment('user')}
        }
        ${LearnConceptButton.getFragment('viewer')}
        ${ConceptForm.getFragment('viewer').if(variables.includeForm)}
      }
    `,
    concept: (variables) => Relay.QL`
      fragment on Concept {
        id
        name
        summary
        summarySource
        path {name}
        reqs {
          id
          ${Req.getFragment('concept')}
        },
        ${ConceptBreadcrumbs.getFragment('concept')}
        ${ConceptForm.getFragment('concept').if(variables.includeForm)}
        ${LearnConceptButton.getFragment('concept')}
        ${MasterConceptButton.getFragment('concept')}
        ${ExplanationList.getFragment('concept')}
        ${DeleteConceptMutation.getFragment('concept')}
      }
    `
  }

});
