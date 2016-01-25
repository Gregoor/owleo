import React, {PropTypes} from 'react';
import Relay from 'react-relay';
import {History} from 'react-router';

import '../../../../lib/foamtree/carrotsearch.foamtree.js';

import createConceptURL from '../../../helpers/create-concept-url';


const ConceptMap = React.createClass({

  mixins: [History],

  componentDidMount() {
    let idGroupMap = this.idGroupMap = new Map();
    let self = this;
    let {history} = this;
    let prevent = (event) => event.preventDefault();
    let foamtree = this.foamtree = new CarrotSearchFoamTree({
      element: this.refs.container,
      dataObject: {
        groups: this._conceptsToGroups(this.props.concept.concepts)
      },
      onGroupClick(event) {
        let {group} = event;
        self._internalChange = true;
        history.pushState(null, group ? createConceptURL(group.concept) : '');
        if (group) foamtree.trigger('doubleclick', event);
      },
      onGroupDrag: prevent,
      onGroupMouseWheel: prevent
      //rainbowStartColor: '#F0F0F0',
      //rainbowEndColor: '#9E9E9E'
    });
    this._expose(this.props.selectedID);

    window.addEventListener('resize', () => {
      foamtree.resize();
      setTimeout(() => foamtree.resize(), 0);
    });
  },

  componentWillReceiveProps(props) {
    if (this.props.selectedID != props.selectedID) {
      if (this._internalChange) this._internalChange = false;
      else this._expose(props.selectedID);
    }
  },

  render() {
    return <div ref="container"
                style={{
                  width: '100%', height: '100%',
                  backgroundColor: 'white'
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
          path {
            name
          },
          conceptsCount,
          concepts {
            id,
            name,
            path {
              name
            },
            conceptsCount,
            concepts {
              id,
              name,
              path {
                name
              },
              conceptsCount,
              concepts {
                id,
                name,
                path {
                  name
                },
                conceptsCount
              }
            }
          }
        }
      }
    `
  }

});
