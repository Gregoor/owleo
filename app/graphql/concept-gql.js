import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';
import {
  connectionDefinitions,
  globalIdField,
  mutationWithClientMutationId,
} from 'graphql-relay';

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
    path: {type: new GraphQLList(GraphQLString)},
    summary: {type: GraphQLString},
    conceptsCount: {type: GraphQLInt},
    container: {type: ConceptType},
    reqs: {
      type: new GraphQLList(ConceptType),
      resolve(concept) {
        return Promise.all(concept.reqs.map(req => Concept.find({id: req})));
      }
    },
    concepts: {
      type: new GraphQLList(ConceptType),
      resolve(root, args) {
        args.container = root.id || '';
        return Concept.find(args);
      }
    },
    explanations: {type: new GraphQLList(ExplanationType)}
  }),
  interfaces: [NodeGQL.interface]
});

let {
  connectionType: ConceptsConnection,
  edgeType: ConceptEdge
} = connectionDefinitions({name: 'Concept', nodeType: ConceptType});


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
      conceptEdge: {
        type: ConceptEdge,
        resolve: concept => console.log(23, concept) || ({node: concept, cursor: null})
      }
    },
    mutateAndGetPayload: (input, root) => Concept.create(input)
  })
};
