import React, {Component} from 'react';
import Relay from 'react-relay';

import ConceptCard from './card';
import CardAnimation from '../card-animation';

class ConceptLearnPage extends Component {

  render() {
    let delay = 0;
    let concepts = this.props.viewer.learnPath.map(concept => (
      <div key={concept.id}
           style={{marginBottom: 15, transitionDelay: `${delay += 100}ms`}}>
        <ConceptCard {...{concept}}/>
      </div>
    ));

    return (
      <div className="mdl-grid" style={{maxWidth: '700px'}}>

        <CardAnimation delay={delay}>{concepts}</CardAnimation>

      </div>
    );
  }

}

export default Relay.createContainer(ConceptLearnPage, {

  initialVariables: {targetId: null},

  fragments: {
    viewer: (vars) => Relay.QL`
      fragment on Viewer {
        learnPath(targetId: $targetId) {
          id,
          ${ConceptCard.getFragment('concept')}
        }
      }
    `
  }
});
