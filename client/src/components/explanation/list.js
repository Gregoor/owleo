import React, {Component} from 'react';
import Relay from 'react-relay';

import CardAnimation from '../card-animation';
import ExplanationCard from '../explanation/card';
import ExplanationForm from '../explanation/form';

class ExplanationList extends Component {

  render() {
    const {user, concept} = this.props;
    let delay = 0;
    let explanations = _(concept.explanations.edges)
      .map(({node: explanation}) => {
        return <ExplanationCard key={explanation.id} {...{explanation, user}}
                                style={{transitionDelay: `${delay += 100}ms`}}/>
      })
      .value();

    if (user) explanations.push(
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

}

export default Relay.createContainer(ExplanationList, {

  fragments: {
    user: () => Relay.QL`
      fragment on User {
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
