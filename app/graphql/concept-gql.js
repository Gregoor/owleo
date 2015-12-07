import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLID
} from 'graphql';
import {
  fromGlobalId, toGlobalId, globalIdField, mutationWithClientMutationId,
  connectionDefinitions, connectionFromArray, connectionArgs
} from 'graphql-relay';

import Concept from '../db/concept';
import Explanation from '../db/explanation';
import getFieldList from './get-field-list';
import NodeGQL from './node-gql';
import UserGQL from './user-gql';

let ExplanationType = new GraphQLObjectType({
  name: 'Explanation',
  fields: () => ({
    id: globalIdField('Explanation'),
    type: {type: GraphQLString},
    content: {type: GraphQLString},
    votes: {type: GraphQLInt},
    author: {type: UserGQL.type}
  })
});

let {connectionType: explanationConnection, edgeType: explanationEdge} =
  connectionDefinitions({name: 'Explanation', nodeType: ExplanationType});


let ConceptType = new GraphQLObjectType({
  name: 'Concept',
  fields: () => ({
    id: globalIdField('Concept'),
    name: {type: GraphQLString},
    path: {type: new GraphQLList(ConceptType)},
    summary: {type: GraphQLString},
    summarySource: {type: GraphQLString},
    conceptsCount: {type: GraphQLInt},
    container: {type: ConceptType},
    reqs: {type: new GraphQLList(ConceptType)},
    concepts: {
      type: new GraphQLList(ConceptType),
      resolve(root, args, context) {
        if (root.concepts) return root.concepts;
        args.container = '';
        if (root[0] && root[0].id) args.container = root[0].id;
        return Concept.find(args, getFieldList(context));
      }
    },
    explanations: {
      type: explanationConnection,
      args: connectionArgs,
      resolve(concept, args) {
        return connectionFromArray(concept.explanations, args)
      }
    },
    explanationsCount: {type: GraphQLInt}
  }),
  interfaces: [NodeGQL.interface]
});

const assertUser = root => {
  if (!root.rootValue.user.id) throw new Error('unauthorized');
};

export default {
  type: ConceptType,
  mutations: {
    createConcept: mutationWithClientMutationId({
      name: 'CreateConcept',
      inputFields: {
        name: {type: GraphQLString},
        summary: {type: GraphQLString},
        summarySource: {type: GraphQLString},
        container: {type: GraphQLID},
        reqs: {type: new GraphQLList(GraphQLID)}
      },
      outputFields: {conceptId: {type: GraphQLID}},
      mutateAndGetPayload: (input, root) => {
        assertUser(root);
        if (input.container) {
          input.container = fromGlobalId(input.container).id;
        }
        if (input.reqs) {
          input.reqs = input.reqs.map(req => fromGlobalId(req).id);
        }
        return Concept.create(input).then(id => {
          return {conceptId: toGlobalId('Concept', id)}
        });
      }
    }),
    updateConcept: mutationWithClientMutationId({
      name: 'UpdateConcept',
      inputFields: {
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        summary: {type: GraphQLString},
        summarySource: {type: GraphQLString},
        container: {type: GraphQLID},
        reqs: {type: new GraphQLList(GraphQLID)}
      },
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload: (input, root, context) => {
        assertUser(root);
        input.id = fromGlobalId(input.id).id;
        if (input.container) {
          input.container = fromGlobalId(input.container).id;
        }
        if (input.reqs) {
          input.reqs = input.reqs.map(req => fromGlobalId(req).id);
        }
        return Concept.update(input.id, input).then(() => ({success: true}));
      }
    }),
    deleteConcept: mutationWithClientMutationId({
      name: 'DeleteConcept',
      inputFields: {conceptId: {type: GraphQLID}},
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload: (input, root) => {
        assertUser(root);
        return Concept.delete(fromGlobalId(input.conceptId).id).then(() => {
          return {success: true};
        });
      }
    }),
    createExplanation: mutationWithClientMutationId({
      name: 'CreateExplanation',
      inputFields: {
        conceptId: {type: GraphQLID},
        type: {type: GraphQLString},
        content: {type: GraphQLString}
      },
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload: (input, root) => {
        assertUser(root);
        input.conceptId = fromGlobalId(input.conceptId).id;
        return Explanation.create(input).then(() => ({success: true}));
      }
    }),
    deleteExplanation: mutationWithClientMutationId({
      name: 'DeleteExplanation',
      inputFields: {
        explanationId: {type: GraphQLID}
      },
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload: (input, root) => {
        assertUser(root);
        return Explanation.delete(fromGlobalId(input.explanationId).id)
          .then(() => ({success: true}));
      }
    })
  }
};
