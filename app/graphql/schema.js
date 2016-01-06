import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull
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
      resolve: (parent, context, root) => {
        return root.rootValue.getUser().then(({id}) => User.find({id}));
      }
    },
    userExists: {
      type: GraphQLBoolean,
      args: {name: {type: new GraphQLNonNull(GraphQLString)}},
      resolve: (root, {name}) => User.find({name}).then(u => Boolean(u))
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

        return context.rootValue.getUser()
          .then(({id: userID}) => Concept.find({id}, getFieldList(context), userID))
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
        const fields = getFieldList(context);
        return args.query ?
          context.rootValue.getUser()
            .then(({id: userID}) => Concept.find(args, fields, userID)) :
          [];
      }
    },
    learnPath: {
      type: new GraphQLList(ConceptGQL.type),
      args: {targetId: {type: GraphQLString}},
      resolve(root, {targetId}, context) {
        if (targetId) {
          return findLearnPath(fromGlobalId(targetId).id)
            .then(ids => {
              const fields = getFieldList(context);
              return context.rootValue.getUser()
                .then(({id: userID}) => Concept.find({ids}, fields, userID))
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
