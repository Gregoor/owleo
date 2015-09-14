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
    return conceptType;
  }
);

let conceptType = new GraphQLObjectType({
  name: 'Concept',
  fields: () => ({
    id: globalIdField('Concept'),
    name: {
      type: GraphQLString
    },
    path: {
      type: new GraphQLList(GraphQLString)
    },
    summary: {
      type: GraphQLString
    },
    conceptsCount: {
      type: GraphQLInt
    },
    reqs: {
      type: new GraphQLList(conceptType),
      resolve: (concept) => {
        return Promise.all(concept.reqs.map(req => getConcept({id: req})));
      }
    },
    concepts: {
      type: new GraphQLList(conceptType),
      args: {
        id: {
          type: GraphQLString
        }
      },
      resolve: (root, args) => {
        args.container = root.id || '';
        return Concept.find(args);
      }
    }
  }),
  interfaces: [nodeInterface]
});

let userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    conceptRoot: {
      type: conceptType,
      resolve: () => ({})
    },
    concept: {
      type: conceptType,
      args: {
        id: {
          type: GraphQLString
        },
        path: {
          type: GraphQLString
        }
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
        type: userType,
        resolve:  () => ({})
      },
      node: nodeField
    }
  })
});
