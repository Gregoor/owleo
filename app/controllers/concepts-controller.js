import _ from 'lodash';
import statusCodes from 'http-status-codes';

import Controller from './controller';
import Concept from '../db/concept';

let conceptParams = (params) => {
  return _.pick(params.concept,
    'name', 'summary', 'summarySource', 'color',
    'container', 'reqs', 'tags', 'links'
  );
};

let openActions = ['all', 'find'];

export default class ConceptControler extends Controller {

  before(actionName) {
    return _.includes(openActions, actionName) ?
      Promise.resolve(true) :
      this.user().then(user => user && user.admin);
  }

  all() {
    return Concept.all();
  }

  allNested() {
    return Concept.all().then(concepts => {
      let stack = concepts;
      let conceptMap = new Map(concepts);
      let containerMap = new Map();
      for (let [id, concept] of concepts) {
        let {container} = concept;
        if (containerMap.has(container)) {
          containerMap.get(container).push(id);
        } else {
          containerMap.set(container, [id]);
        }
      }

      let fetchContainees = id => {
        let ids = containerMap.get(id);
        let containees = [];
        if (ids) containees = ids.map(containeeId => {
          let concept = conceptMap.get(containeeId);
          concept.containees = fetchContainees(containeeId);
          return concept;
        });
        return containees;
      };

      return fetchContainees(null);
    });
  }

  find(id) {
    return this.user().then(user => {
      return Concept.find(user, id).then(concept => {
        return concept || statusCodes.NOT_FOUND;
      });
    });
  }

  create() {
    return this.user().then(user => {
      return Concept.create(user, conceptParams(this.params));
    });
  }

  update(id) {
    return this.user()
      .then(user => {
        return Concept.update(user, id, conceptParams(this.params));
      })
      .catch(error => {
        if (error == Concept.ERRORS.CONTAINER_LOOP) {
          return {
            'status': 409,
            'body': {'error': 'given container already in the loop'}
          };
        }
      });
  }

  delete(id) {
    return Concept.delete(id);
  }

  reposition() {
    return Concept.reposition(this.params.concepts);
  }

}
