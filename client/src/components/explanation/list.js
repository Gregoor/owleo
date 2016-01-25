import React from 'react';
import Relay from 'react-relay';

import CardAnimation from '../card-animation';
import ExplanationCard from '../explanation/card';
import ExplanationForm from '../explanation/form';

class ExplanationList extends React.Component {

  render() {
    const {user, concept} = this.props;
    let delay = 0;
    let explanations = _(concept.explanations.edges)
      .map(({node: explanation}) => {
        return <ExplanationCard key={explanation.id} {...{explanation, user}}
                                style={{transitionDelay: `${delay += 100}ms`}}/>
      })
      .value();

    if (user && !user.isGuest) explanations.push(
      <div key="new" style={{transitionDelay: `${delay += 100}ms`}}>
        <ExplanationForm {...{concept}} explanation={null}/>
      </div>
    );

    if (_.isEmpty(explanations)) return <div/>;

    return (
      <CardAnimation delay={delay}>
        <h4>Explanations</h4>{explanations}
      </CardAnimation>
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
