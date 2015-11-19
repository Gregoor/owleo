import {nodeDefinitions, fromGlobalId} from 'graphql-relay';

import getFieldList from './get-field-list';
import Concept from '../db/concept';

let {nodeInterface, nodeField} = nodeDefinitions(
  (globalId, context) => {
    let {type, id} = fromGlobalId(globalId);
    return type == 'Concept' ?
      Concept.find({id}, getFieldList(context)).then(([c]) => c) : null;
  },
  (obj) => {
    return require('./concept-gql').type;
  }
);

export default {interface: nodeInterface, field: nodeField};
