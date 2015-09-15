import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  cursorForObjectInConnection,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
  toGlobalId,
} from 'graphql-relay';

// TODO: ALWAYS BE UPDTING SCHEMA

import Concept from '../db/concept';

let getConcept = args => Concept.find(args).then(arr => arr[0]);

let {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    let {type, id} = fromGlobalId(globalId);
    return type == 'Concept' ? Concept.find({id}).then(arr => arr[0]) : null;
  },
  (obj) => {
    return ConceptType;
  }
);

let ExplanationType = new GraphQLObjectType({
  name: 'Explanation',
  fields: () => ({
    id: globalIdField('Explanation'),
    content: {type: GraphQLString},
    votes: {type: GraphQLInt},
    author: {type: UserType}
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
    reqs: {
      type: new GraphQLList(ConceptType),
      resolve: (concept) => {
        return Promise.all(concept.reqs.map(req => getConcept({id: req})));
      }
    },
    concepts: {
      type: new GraphQLList(ConceptType),
      args: {
        id: {type: GraphQLString}
      },
      resolve: (root, args, furf) => {
        args.container = root.id || '';
        return Concept.find(args);
      }
    },
    explanations: {type: new GraphQLList(ExplanationType)}
  }),
  interfaces: [nodeInterface]
});

let UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    //id: globalIdField('User'),
    name: {type: GraphQLString},
    conceptRoot: {
      type: ConceptType,
      resolve: () => ({})
    },
    concept: {
      type: ConceptType,
      args: {
        id: {type: GraphQLString},
        path: {type: GraphQLString}
      },
      resolve: (root, args) => {
        if (args.id) {
          let {id} = fromGlobalId(args.id);
          args = {id};
        }
        return getConcept(args);
      }
    }
  })
});

export default new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
      viewer: {
        type: UserType,
        resolve:  () => ({})
      },
      node: nodeField
    }
  })
});
