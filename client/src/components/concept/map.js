import React, {PropTypes} from 'react';
import Relay from 'react-relay';
import {History} from 'react-router';

import '../../../lib/foamtree/carrotsearch.foamtree';

import {pathToUrl} from '../../helpers';

let ConceptMap = React.createClass({

  mixins: [History],

  componentDidMount() {
    let idGroupMap = this.idGroupMap = new Map();
    let self = this;
    let {history} = this;
    let prevent = (event) => event.preventDefault();
    let foamtree = this.foamtree = new CarrotSearchFoamTree({
      element: this.refs.container,
      wireframeLabelDrawing: 'always',
      dataObject: {
        groups: this._conceptsToGroups(this.props.concept.concepts)
      },
      onGroupClick(event) {
        let {group} = event;
        self.selectedChange = true;
        history.pushState(null, group ? pathToUrl(group.concept.path) : '');
        if (group) foamtree.trigger('doubleclick', event);
      },
      onGroupDrag: prevent,
      onGroupMouseWheel: prevent
    });
    this._expose(this.props.selectedId);
  },

  componentWillReceiveProps(props) {
    if (this.props.selectedId != props.selectedId) {
      if (this.selectedChange) this.selectedChange = false;
      else this._expose(props.selectedId);
    }
  },

  render() {
    return <div ref="container"
                style={{
                  width: '100%', height: '100%',
                  backgroundColor: '#FAFAFA'
                }}/>;
  },

  _conceptsToGroups(concepts) {
    return concepts.map(concept => {
      let group = {
        concept, label: concept.name, weight: concept.conceptsCount
      };
      if (concept.concepts) {
        group.groups = this._conceptsToGroups(concept.concepts);
      }
      this.idGroupMap.set(concept.id, group);
      return group;
    });
  },

  _expose(id) {
    this.foamtree.expose(this.idGroupMap.get(id));
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
