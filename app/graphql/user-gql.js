import {GraphQLObjectType, GraphQLString} from 'graphql';
import {globalIdField} from 'graphql-relay';

import NodeGQL from './node-gql';

export default {
  type: new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: globalIdField('User'),
      name: {type: GraphQLString}
    }),
    interfaces: [NodeGQL.interface]
  })
};
