import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull
} from 'graphql';
import _ from 'lodash';

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
  fields: Object.assign({
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
    learnPath: {
      type: new GraphQLList(ConceptGQL.type),
      args: {
        targetID: {type: GraphQLString},
        includeContained: {type: GraphQLBoolean},
        mastered: {type: GraphQLBoolean}
      },
      resolve(root, {targetID, includeContained, mastered}, context) {
        if (!targetID) return;

        return findLearnPath({id: targetID, includeContained}).then((ids) => {
          const fields = getFieldList(context);
        const filterMastered = mastered !== undefined;
        if (filterMastered) fields.mastered = true;
        return context.rootValue.getUser()
          .then(({id: userID}) => {
            return Concept.find({ids: _.uniq(ids)}, fields, userID);
          })
          .then(concepts => {
            let orderedConcepts = [];
            for (const concept of concepts) {
              if (!filterMastered || concept.mastered == mastered) {
                orderedConcepts[ids.indexOf(concept.id)] = concept;
              }
            }
            return orderedConcepts;
          })
        });
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
