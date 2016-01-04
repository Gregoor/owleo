import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean
} from 'graphql';

import {
  fromGlobalId,
  toGlobalId,
  mutationWithClientMutationId
} from 'graphql-relay';


import Concept from '../db/concept';
import User from '../db/user';
import findLearnPath from '../db/learn-path';
import getFieldList from './get-field-list';
import NodeGQL from './node-gql';
import UserGQL from './user-gql';
import ConceptGQL from './concept-gql';


let ViewerType = new GraphQLObjectType({
  name: 'Viewer',
  fields: {
    user: {
      type: UserGQL.type,
      resolve: (parent, dunno, root) => User.find({id: root.rootValue.user.id})
  },
    conceptRoot: {
      type: ConceptGQL.type,
      resolve: () => ({})
    },
    concept: {
      type: ConceptGQL.type,
      args: {
        id: {type: GraphQLString}
      },
      resolve(root, args, context) {
        const {id} = args;
        if (!id) return null;

        const userID = context.rootValue.user.id;
        return Concept.find({id}, getFieldList(context), userID)
          .then(([c]) => c);
      }
    },
    concepts: {
      type: new GraphQLList(ConceptGQL.type),
      args: {
        query: {type: GraphQLString},
        limit: {type: GraphQLInt},
        exclude: {type: new GraphQLList(GraphQLString)}
      },
      resolve(root, args, context) {
        if (args.exclude) {
          args.exclude = args.exclude.map(id => fromGlobalId(id).id);
        }
        return args.query ?
          Concept.find(args, getFieldList(context), context.rootValue.user.id) :
          [];
      }
    },
    learnPath: {
      type: new GraphQLList(ConceptGQL.type),
      args: {targetId: {type: GraphQLString}},
      resolve(root, {targetId}, context) {
        if (targetId) {
          const userID = context.rootValue.user.id;
          return findLearnPath(fromGlobalId(targetId).id)
            .then(ids => {
              return Concept.find({ids}, getFieldList(context), userID)
                .then(concepts => {
                  let orderedConcepts = [];
                  for (let concept of concepts) {
                    orderedConcepts[ids.indexOf(concept.id)] = concept;
                  }
                  return orderedConcepts;
                })
            });
        }
        return null;
      }
    }
  }
});

export default new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
      viewer: {
        type: ViewerType,
        resolve: (root) => ({id: toGlobalId('Viewer', 'wat')})
      },
      node: NodeGQL.field
    }
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: Object.assign({
      login: mutationWithClientMutationId({
        name: 'Login',
        inputFields: {
          name: {type: GraphQLString},
          password: {type: GraphQLString}
        },
        outputFields: {
          success: {type: GraphQLBoolean}
        },
        mutateAndGetPayload(input, root) {
          return User.authenticate(input).then((user) => {
            if (!user) return new Error('unauthorized');

            root.rootValue.user.id = user.id;
            return {success: true};
          });
        }
      }),
      logout: mutationWithClientMutationId({
        name: 'Logout',
        outputFields: {
          success: {type: GraphQLBoolean}
        },
        mutateAndGetPayload(input, root) {
          root.rootValue.user.id = null;
          return {success: true};
        }
      })
    }, ConceptGQL.mutations)
  })
});
