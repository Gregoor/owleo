import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLID
} from 'graphql';
import {
  fromGlobalId, toGlobalId, globalIdField,
  mutationWithClientMutationId} from 'graphql-relay';

import getFieldList from './get-field-list';
import NodeGQL from './node-gql';
import UserGQL from './user-gql';
import Concept from '../db/concept';

let ExplanationType = new GraphQLObjectType({
  name: 'Explanation',
  fields: () => ({
    id: globalIdField('Explanation'),
    content: {type: GraphQLString},
    votes: {type: GraphQLInt},
    author: {type: UserGQL.type}
  })
});

let ConceptType = new GraphQLObjectType({
  name: 'Concept',
  fields: () => ({
    id: globalIdField('Concept'),
    name: {type: GraphQLString},
    path: {type: new GraphQLList(ConceptType)},
    summary: {type: GraphQLString},
    conceptsCount: {type: GraphQLInt},
    container: {type: ConceptType},
    reqs: {type: new GraphQLList(ConceptType)},
    concepts: {
      type: new GraphQLList(ConceptType),
      resolve(root, args, context) {
        if (root.concepts) return root.concepts;
        args.container = '';
        if (root[0] && root[0].id) args.container = root[0].id;
        return Concept.find(args, getFieldList(context));
      }
    },
    explanations: {type: new GraphQLList(ExplanationType)}
  }),
  interfaces: [NodeGQL.interface]
});


export default {
  type: ConceptType,
  create: mutationWithClientMutationId({
    name: 'CreateConcept',
    inputFields: {
      name: {type: GraphQLString},
      summary: {type: GraphQLString},
      summarySource: {type: GraphQLString},
      container: {type: GraphQLID},
      reqs: {type: new GraphQLList(GraphQLID)}
    },
    outputFields: {conceptId: {type: GraphQLID}},
    mutateAndGetPayload: (input, root) => {
      if (input.container) {
        input.container = fromGlobalId(input.container).id;
      }
      if (input.reqs) {
        input.reqs = input.reqs.map(req => fromGlobalId(req).id);
      }
      return Concept.create(input).then(id => {
        return {conceptId: toGlobalId('Concept', id)}
      });
    }
  }),
  delete: mutationWithClientMutationId({
    name: 'DeleteConcept',
    inputFields: {conceptId: {type: GraphQLID}},
    outputFields: {success: {type: GraphQLBoolean}},
    mutateAndGetPayload: (input, root) => {
      return Concept.delete(fromGlobalId(input.conceptId).id).then(() => {
        return {success: true};
      });
    }
  })
};
