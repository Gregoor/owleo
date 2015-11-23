import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  connectionDefinitions,
  fromGlobalId,
  mutationWithClientMutationId,
  toGlobalId,
} from 'graphql-relay';


import getFieldList from './get-field-list';
import NodeGQL from './node-gql';
import UserGQL from './user-gql';
import ConceptGQL from './concept-gql';
import Concept from '../db/concept';
import User from '../db/user';

let {
  connectionType: IdentitiesConnection,
  edgeType: IdentityEdge
} = connectionDefinitions({name: 'Identity', nodeType: UserGQL.type});

let ViewerType = new GraphQLObjectType({
  name: 'Viewer',
  fields: {
    identities: {
      type: new GraphQLList(UserGQL.type),
      resolve: (parent, dunno, root) => {
        root.rootValue.user().then(u => u ? [u] : [])
      }
    },
    conceptRoot: {
      type: ConceptGQL.type,
      resolve: () => ({})
    },
    concept: {
      type: ConceptGQL.type,
      args: {
        path: {type: GraphQLString},
        id: {type: GraphQLString}
      },
      resolve(root, args, context) {
        if (args.id) {
          let {id} = fromGlobalId(args.id);
          args = {id};
        }
        return Concept.find(args, getFieldList(context)).then(([c]) => c);
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
        return args.query ? Concept.find(args, getFieldList(context)) : [];
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
    fields: {
      createConcept: ConceptGQL.create,
      updateConcept: ConceptGQL.update,
      deleteConcept: ConceptGQL.delete,
      login: mutationWithClientMutationId({
        name: 'Login',
        inputFields: {
          name: {type: GraphQLString},
          password: {type: GraphQLString}
        },
        outputFields: {
          identityEdge: {
            type: IdentityEdge,
            resolve: u => ({node: u, cursor: null})
          },
          viewer: {type: ViewerType, resolve: () => ({})}
        },
        mutateAndGetPayload(input, root) {
          return User.authenticate(input).then((user) => {
            return user ?
              root.rootValue.user().then(u => Object.assign(u, user)) : {};
          });
        }
      })
    }
  })
});
