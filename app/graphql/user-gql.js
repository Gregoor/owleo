import {GraphQLObjectType, GraphQLString, GraphQLBoolean} from 'graphql';
import {globalIdField} from 'graphql-relay';

import NodeGQL from './node-gql';

export default {
  type: new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: globalIdField('User'),
      name: {type: GraphQLString},
      admin: {type: GraphQLBoolean}
    }),
    interfaces: [NodeGQL.interface]
  })
};
