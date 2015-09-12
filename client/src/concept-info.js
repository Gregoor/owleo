import React, {Component} from 'react';
import Relay from 'react-relay';

class ConceptInfo extends Component {

  render() {
    let {name, summary} = this.props.concept;
    return (
      <div>
        <h1>{name}</h1>
        {summary}
      </div>
    );
  }

}

export default Relay.createContainer(ConceptInfo, {

  initialVariables: {id: null},

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        name,
        summary
      }
    `
  }

});
