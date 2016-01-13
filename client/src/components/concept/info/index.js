import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import _ from 'lodash';
import {
  Card, CardActions, CardMenu, CardText, CardTitle, Cell, Button, FABButton
} from 'react-mdl';

import history from '../../../history';
import DeleteConceptMutation from '../../../mutations/concept/delete';
import Req from './req';
import ConceptBreadcrumbs from './../breadcrumbs';
import MasterConceptButton from './master-button';
import ConceptForm from './../form';
import ExplanationList from '../../explanation/list';
import CardAnimation from '../../card-animation';

class ConceptInfo extends React.Component {

  componentDidMount() {
    document.title = this.props.concept.name;
  }

  render() {
    const {viewer, concept} = this.props;
    const {user} = viewer;
    if (this.props.relay.variables.includeForm) {
      return <ConceptForm {...{viewer, concept}}/>;
    }
    const {id, name, summary, summarySource, reqs} = concept;
    return (
      <div style={{margin: '0 auto', width: '100%', maxWidth: '700px'}}>
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
              <MasterConceptButton concept={concept} style={{marginTop: -45}}
                                   onMaster={this.props.onMaster}/>
            </CardMenu>
            {!this.props.includeReqs || _.isEmpty(reqs) ? '' :
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
                  <a href={summarySource} target="_blank">{summarySource}</a>
                </div> :
                <div style={{whiteSpace: 'pre-wrap'}}>{summary}</div>
              }
            </CardText>
            {user && user.admin ? (
              <CardActions>
                <Button onClick={this._handleDelete.bind(this)}>
                  Delete
                </Button>
                <Button onClick={this._handleEdit.bind(this)}>
                  Edit
                </Button>
              </CardActions>
            ) : ''}
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

ConceptInfo.defaultProps = {
  includeReqs: true, nameAsLink: false, onMaster: _.noop
};

export default Relay.createContainer(ConceptInfo, {

  initialVariables: {includeForm: false},

  fragments: {
    viewer: (variables) => Relay.QL`
      fragment on Viewer {
        user {
          id
          admin
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
        path {name}
        reqs {
          id
          ${Req.getFragment('concept')}
        },
        ${ConceptBreadcrumbs.getFragment('concept')}
        ${ConceptForm.getFragment('concept').if(variables.includeForm)}
        ${MasterConceptButton.getFragment('concept')}
        ${ExplanationList.getFragment('concept')}
        ${DeleteConceptMutation.getFragment('concept')}
      }
    `
  }

});
