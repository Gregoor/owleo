import React, {PropTypes} from 'react';
import Relay from 'react-relay';
import {History} from 'react-router';

import '../../../lib/foamtree/carrotsearch.foamtree';

import {pathToUrl} from '../../helpers';

let ConceptMap = React.createClass({

  rendered: false,

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
        groups: this.props.concept.concepts.map(concept => {
          let group = {
            concept, label: concept.name, weight: concept.conceptsCount,
            groups: concept.concepts.map(concept => ({
              concept, label: concept.name, weight: concept.conceptsCount
            }))
          };
          idGroupMap.set(concept.id, group);
          return group;
        })
      },
      onGroupClick(event) {
        let {group} = event;
        history.pushState(null, group ? pathToUrl(group.concept.path) : '');
        if (group) foamtree.trigger('doubleclick', event);
      },
      onRolloutComplete() {
        self.rendered = true;
        self._onProps(self.props);
      },
      onGroupDrag: prevent,
      onGroupMouseWheel: prevent
    });
    this._onProps(this.props);
  },

  componentWillReceiveProps(props) {
    this._onProps(props);
  },

  render() {
    return <div ref="container"
                style={{
                  width: '100%', height: '100%',
                  backgroundColor: '#FAFAFA'
                }}/>;
  },

  _onProps(props) {
    if (!this.rendered) return;
    this.foamtree.expose(this.idGroupMap.get(props.selectedId));
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
