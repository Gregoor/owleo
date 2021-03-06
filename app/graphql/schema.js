import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull
} from 'graphql';

import {
  toGlobalId,
  mutationWithClientMutationId
} from 'graphql-relay';


import User from '../db/user';
import NodeGQL from './node-gql';
import UserGQL from './user-gql';
import ConceptGQL from './concept-gql';


let ViewerType = new GraphQLObjectType({
  name: 'Viewer',
  fields: Object.assign({
    user: {
      type: UserGQL.type,
      resolve(parent, args, context) {
        return context.getUser().then(({id, name}) => User.findOne({id}));
      }
    },
    userExists: {
      type: GraphQLBoolean,
      args: {name: {type: new GraphQLNonNull(GraphQLString)}},
      resolve(root, {name}) {
        return User.findOne({name}).then((user) => Boolean(user));
      }
    }
  }, ConceptGQL.queries)
});

export const Schema = new GraphQLSchema({
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
      register: mutationWithClientMutationId({
        name: 'Register',
        inputFields: {
          name: {type: new GraphQLNonNull(GraphQLString)},
          password: {type: new GraphQLNonNull(GraphQLString)}
        },
        outputFields: {
          success: {type: GraphQLBoolean}
        },
        mutateAndGetPayload(input, context) {
          return context.getUser()
            .then(({id}) => User.registerGuest(id, input))
            .then(() => ({success: true}));
        }
      }),
      login: mutationWithClientMutationId({
        name: 'Login',
        inputFields: {
          name: {type: new GraphQLNonNull(GraphQLString)},
          password: {type: new GraphQLNonNull(GraphQLString)}
        },
        outputFields: {
          success: {type: GraphQLBoolean}
        },
        mutateAndGetPayload(input, context) {
          return User.authenticate(input).then((user) => {
            if (!user) return new Error('unauthorized');

            context.setUser(user.id);
            return {success: true};
          });
        }
      }),
      logout: mutationWithClientMutationId({
        name: 'Logout',
        outputFields: {
          success: {type: GraphQLBoolean}
        },
        mutateAndGetPayload(input, context) {
          context.setUser(null);
          return {success: true};
        }
      })
    }, ConceptGQL.mutations)
  })
});
