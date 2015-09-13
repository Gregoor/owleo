import React, {Component} from 'react';
import Relay from 'react-relay';

class ConceptInfo extends Component {

  render() {
    let {name, summary} = this.props.concept;
    return (
      <div style={{maxWidth: '600px', margin: '0 auto', border: '1px solid black', padding: '15px'}}>
        <h1 style={{marginTop: 0}}>{name}</h1>
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
