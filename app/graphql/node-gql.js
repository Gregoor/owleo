import {nodeDefinitions, fromGlobalId} from 'graphql-relay';

import Concept from '../db/concept';

let {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    let {type, id} = fromGlobalId(globalId);
    return type == 'Concept' ? Concept.find({id}) : null;
  },
  (obj) => {
    return require('./concept-gql').type;
  }
);

export default {interface: nodeInterface, field: nodeField};
