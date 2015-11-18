import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';
import {globalIdField, mutationWithClientMutationId} from 'graphql-relay';

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
        args.container = root.id || '';
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
      container: {type: GraphQLString},
      reqs: {type: new GraphQLList(GraphQLString)}
    },
    outputFields: {
      conceptEdge: {type: GraphQLString}
    },
    mutateAndGetPayload: (input, root) => Concept.create(input)
  })
};
