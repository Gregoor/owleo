import React, {PropTypes} from 'react';
import Relay from 'react-relay';
import {History} from 'react-router';

import '../../../lib/foamtree/carrotsearch.foamtree';

import {pathToUrl} from '../../helpers';

let ConceptMap = React.createClass({

  mixins: [History],

  componentDidMount() {
    let {history} = this;

    let prevent = (event) => event.preventDefault();

    let foamtree = this.foamtree = new CarrotSearchFoamTree({
      element: this.refs.container,
      wireframeLabelDrawing: 'always',
      dataObject: {
        groups: this.props.concept.concepts.map(concept => ({
          concept, label: concept.name, weight: concept.conceptsCount,
          groups: concept.concepts.map(concept => ({
            concept, label: concept.name, weight: concept.conceptsCount
          }))
        }))
      },
      onGroupClick(event) {
        let {group} = event;
        if (!group) return;
        history.pushState(null, pathToUrl(group.concept.path));
        foamtree.trigger('doubleclick', event);
      },
      onGroupDrag: prevent,
      onGroupMouseWheel: prevent
    })
  },

  render() {
    return <div ref="container"
                style={{
                  width: '100%', height: '100%',
                  backgroundColor: '#FAFAFA'
                }}/>;
  }

});

export default Relay.createContainer(ConceptMap, {

  fragments: {
    concept: () =>  Relay.QL`
      fragment on Concept {
        concepts {
          id,
          name,
          path,
          conceptsCount,
          concepts {
            id,
            name,
            conceptsCount,
            path
          }
        }
      }
    `
  }

});
