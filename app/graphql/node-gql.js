import {nodeDefinitions, fromGlobalId} from 'graphql-relay';

import getFieldList from './get-field-list';
import Concept from '../db/concept';

let {nodeInterface, nodeField} = nodeDefinitions(
  (globalId, context) => {
    let {type, id} = fromGlobalId(globalId);

    return type == 'Concept' ?
      context.rootValue.getUser()
        .then(({id: userID}) => {
          return Concept.find({id}, getFieldList(context), userID);
        })
        .then(([c]) => c) :
      null;
  },
  (obj) => {
    return require('./concept-gql').type;
  }
);

export default {interface: nodeInterface, field: nodeField};
