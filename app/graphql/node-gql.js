import {nodeDefinitions, fromGlobalId} from 'graphql-relay';

import Concept from '../db/concept';

let {nodeInterface, nodeField} = nodeDefinitions(
  (globalId, context) => {
    const {type, id} = fromGlobalId(globalId);
    return type == 'Concept' ? Concept.findOne({id}) : null;
  },
  (obj) => require('./concept-gql').default.type
);

export default {interface: nodeInterface, field: nodeField};
