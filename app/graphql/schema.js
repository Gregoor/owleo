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
      resolve(parent, context, root) {
        return root.rootValue.getUser().then(({id}) => User.findOne({id}));
      }
    },
    userExists: {
      type: GraphQLBoolean,
      args: {name: {type: new GraphQLNonNull(GraphQLString)}},
      resolve: (root, {name}) => User.findOne({name}).then(u => console.log(u) || Boolean(u))
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
          name: {type: GraphQLString},
          password: {type: GraphQLString}
        },
        outputFields: {
          success: {type: GraphQLBoolean}
        },
        mutateAndGetPayload(input, root) {
          return root.rootValue.getUser()
            .then(({id}) => User.registerGuest(id, input))
            .then(() => ({success: true}));
        }
      }),
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

            root.rootValue.setUser(user.id);
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
          root.rootValue.setUser(null);
          return {success: true};
        }
      })
    }, ConceptGQL.mutations)
  })
});
