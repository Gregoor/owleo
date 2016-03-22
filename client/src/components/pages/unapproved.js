import React from 'react';
import Relay from 'react-relay';
import {
  Button, Card, CardActions, CardText, CardTitle, Cell, Grid
} from 'react-mdl';

import UpdateExplanationMutation from '../../mutations/explanation/update';
import DeleteExplanationMutation from '../../mutations/explanation/delete';
import ConceptBreadcrumbs from '../concept/breadcrumbs';
import ExplanationContent from '../explanation/content';

class UnapprovedExplanation extends React.Component {

  state = {
    showContent: false
  };

  constructor(...args) {
    super(...args);
    this._approve = this._approve.bind(this);
    this._delete = this._delete.bind(this);
    this._show = this._show.bind(this);
  }

  render() {
    const {style, explanation} = this.props;
    const {content, concept} = explanation;
    const {showContent} = this.state;
    return (
      <Card {...{style}}>
        <CardTitle>
          <ConceptBreadcrumbs concept={concept} leafAsLink/>
        </CardTitle>
        <CardText>
          {showContent ?
            <ExplanationContent explanation={explanation}/> :
            content}
        </CardText>
        <CardActions>
          <Button primary onClick={this._approve}>Approve</Button>
          <Button accent onClick={this._delete}>Delete</Button>
          {showContent ? '' : <Button onClick={this._show}>Show</Button>}
        </CardActions>
      </Card>
    )
  }

  _approve() {
    const {explanation} = this.props;
    Relay.Store.commitUpdate(
      new UpdateExplanationMutation({explanation, approved: true}),
      {
        onSuccess: () => location.reload(),
        onFailure: (t) => console.error(t.getError().source.errors)
      }
    );
  }

  _delete() {
    if (!confirm('Do you really want to delete that explanatoin?')) return;
    const {explanation} = this.props;
    Relay.Store.commitUpdate(new DeleteExplanationMutation({explanation}), {
      onSuccess: () => location.reload(),
      onFailure: (t) => console.error(t.getError().source.errors)
    });
  }

  _show() {
    this.setState({showContent: true});
  }

}

UnapprovedExplanation = Relay.createContainer(UnapprovedExplanation, {

  fragments: {
    explanation: () => Relay.QL`
      fragment on Explanation {
        content
        ${ExplanationContent.getFragment('explanation')}
        ${UpdateExplanationMutation.getFragment('explanation')}
        ${DeleteExplanationMutation.getFragment('explanation')}
        concept {
          ${ConceptBreadcrumbs.getFragment('concept')}
        }
      }
    `
  }

});


const UnapprovedPage = ({viewer: {unapproved: {explanations}}}) => (
  <Grid style={{maxWidth: 700}}>
    <Cell col={12}>
      <h1>Unapproved</h1>
    </Cell>
    <Cell col={12}>
      <h2>Explanations</h2>
    </Cell>
    {explanations.map((explanation) => (
      <UnapprovedExplanation key={explanation.id} style={{marginTop: 10}}
                             explanation={explanation}/>
    ))}
  </Grid>
);

export default Relay.createContainer(UnapprovedPage, {

  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        unapproved {
          explanations {
            id
            ${UnapprovedExplanation.getFragment('explanation')}
          }
        }
      }
    `
  }

});
