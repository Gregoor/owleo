import React from 'react';
import Relay from 'react-relay';

import ExplanationCard from '../explanation/card';
import ExplanationForm from '../explanation/form';

class ExplanationList extends React.Component {

  render() {
    const {user, concept} = this.props;
    let explanations = _(concept.explanations.edges)
      .map(({node: explanation}) => {
        return <ExplanationCard key={explanation.id} {...{explanation, user}}/>
      })
      .value();

    if (user && !user.isGuest) explanations.push(
      <div key="new"><ExplanationForm {...{concept}} explanation={null}/></div>
    );

    if (_.isEmpty(explanations)) return <div/>;

    return (
      <div>
        <h4>Explanations</h4>{explanations}
      </div>
    );
  }

}

export default Relay.createContainer(ExplanationList, {

  fragments: {
    user: () => Relay.QL`
      fragment on User {
        isGuest
        ${ExplanationCard.getFragment('user')}
      }
    `,
    concept: () => Relay.QL`
      fragment on Concept {
        explanations(first: 10) {
          edges {
            node {
              id
              votes
              ${ExplanationCard.getFragment('explanation')}
            }
          }
        }
        ${ExplanationForm.getFragment('concept')}
      }
    `
  }

});
