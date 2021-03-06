import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import _ from 'lodash';
import {
  Card, CardMenu, CardText, CardTitle, IconButton, Menu, MenuItem
} from 'react-mdl';

import DeleteConceptMutation from '../../../mutations/concept/delete';
import fromGlobalID from '../../../helpers/from-global-id';
import Req from './req';
import LearnConceptButton from '../learn-button';
import MasterConceptButton from '../master-button';
import ConceptForm from './../form';
import ExplanationList from '../../explanation/list';
import {Mastered} from '../../icons';
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

    const fabProps = {concept, style: {marginTop: -79, marginLeft: 628}};

    const {id, name, mastered, summary, summarySource, reqs} = concept;
    return (
      <div style={{margin: '0 auto'}}>
        <Card key="concept" style={{overflow: 'visible'}}>
          <CardTitle style={{paddingBottom: 0, fontSize: 28}}>
            {this.props.nameAsLink ?
              <Link to="/concepts" query={{id: fromGlobalID(id)}}>
                {name}
              </Link> :
              name
            }
            {mastered ? <Mastered style={{marginLeft: 10}}/> : ''}
          </CardTitle>
          {showMasterButton ?
            <MasterConceptButton {...fabProps} onMaster={this.props.onMaster}/> :
            <LearnConceptButton {...fabProps}/>
          }
          <CardMenu>
            {user && user.isAdmin ? (
              <div>
                <IconButton name="more_vert" id="concept-menu"
                            style={{marginLeft: 24}}/>
                <Menu target="concept-menu">
                  <MenuItem onClick={this._handleEdit.bind(this)}>
                    Edit
                  </MenuItem>
                  <MenuItem onClick={this._handleDelete.bind(this)}>
                    Delete
                  </MenuItem>
                </Menu>
              </div>
            ) : ''}
          </CardMenu>
          {!showReqs || _.isEmpty(reqs) ? '' :
            <div>
              <div className="section-title">Requirements</div>
              {reqs.map((concept, i) => (
                <Req key={concept.id} concept={concept}
                     isLast={i + 1 == reqs.length}/>
              ))}
            </div>
          }
          <CardText>
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
        <ExplanationList {...{user, concept}} />
      </div>
    );
  }

  _handleDelete() {
    const {concept} = this.props;
    if (!confirm(`Do you really want to delete "${concept.name}"?`)) return;

    Relay.Store.commitUpdate(new DeleteConceptMutation({concept}), {
      onSuccess: (t) => {
        location.href = '/';
      },
      onFailure: (t) => console.error(t.getError().source.errors)
    });
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
          isAdmin
          ${ExplanationList.getFragment('user')}
        }
        ${ConceptForm.getFragment('viewer').if(variables.includeForm)}
      }
    `,
    concept: (variables) => Relay.QL`
      fragment on Concept {
        id
        name
        summary
        summarySource
        mastered
        path {name}
        reqs {
          id
          ${Req.getFragment('concept')}
        },
        ${ConceptForm.getFragment('concept').if(variables.includeForm)}
        ${LearnConceptButton.getFragment('concept')}
        ${MasterConceptButton.getFragment('concept')}
        ${ExplanationList.getFragment('concept')}
        ${DeleteConceptMutation.getFragment('concept')}
      }
    `
  }

});
