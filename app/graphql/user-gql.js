import {
  GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLBoolean
} from 'graphql';
import {globalIdField} from 'graphql-relay';

import NodeGQL from './node-gql';

export default {
  type: new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: globalIdField('User'),
      name: {type: GraphQLString},
      isAdmin: {type: GraphQLBoolean},
      isGuest: {type: GraphQLBoolean, resolve: ({isGuest}) => Boolean(isGuest)},
      masteredConceptsCount: {type: GraphQLInt}
    }),
    interfaces: [NodeGQL.interface]
  })
};
