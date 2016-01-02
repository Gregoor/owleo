import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLID,
  GraphQLEnumType,
  GraphQLNonNull
} from 'graphql';
import {
  fromGlobalId, toGlobalId, globalIdField, mutationWithClientMutationId,
  connectionDefinitions, connectionFromArray, connectionArgs
} from 'graphql-relay';
import _ from 'lodash';

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
    hasUpvoted: {
      type: GraphQLBoolean,
      resolve: ({hasUpvoted}) => Boolean(hasUpvoted)
    },
    hasDownvoted: {
      type: GraphQLBoolean,
      resolve: ({hasDownvoted}) => Boolean(hasDownvoted)
    },
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
        return Concept.find(args, getFieldList(context), context.rootValue.user.id);
      }
    },
    explanations: {
      type: explanationConnection,
      args: connectionArgs,
      resolve(concept, args) {
        return connectionFromArray(
          _(concept.explanations).sortBy('votes').reverse().value(),
          args
        );
      }
    },
    explanationsCount: {type: GraphQLInt},
    mastered: {type: GraphQLBoolean, resolve: ({mastered}) => Boolean(mastered)}
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
      outputFields: {conceptID: {type: GraphQLID}},
      mutateAndGetPayload: (input, root) => {
        assertUser(root);
        if (input.container) {
          input.container = fromGlobalId(input.container).id;
        }
        if (input.reqs) {
          input.reqs = input.reqs.map(req => fromGlobalId(req).id);
        }
        return Concept.create(input).then(id => {
          return {conceptID: toGlobalId('Concept', id)}
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
      inputFields: {conceptID: {type: new GraphQLNonNull(GraphQLID)}},
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload(input, root) {
        assertUser(root);
        return Concept.delete(fromGlobalId(input.conceptID).id).then(() => {
          return {success: true};
        });
      }
    }),
    masterConcept: mutationWithClientMutationId({
      name: 'MasterConcept',
      inputFields: {
        conceptID: {type: new GraphQLNonNull(GraphQLID)},
        mastered: {type: new GraphQLNonNull(GraphQLBoolean)}
      },
      outputFields: {
        concept: {type: ConceptType}
      },
      mutateAndGetPayload(input, root) {
        const {conceptID, mastered} = input;
        const {id} = fromGlobalId(conceptID);
        const userID = root.rootValue.user.id;
        assertUser(root);
        return Concept.master(id, userID, mastered)
          .then(() => Concept.find({id}, getFieldList(root).concept, userID))
          .then(([concept]) => ({concept}));

      }
    }),
    createExplanation: mutationWithClientMutationId({
      name: 'CreateExplanation',
      inputFields: {
        conceptID: {type: new GraphQLNonNull(GraphQLID)},
        type: {type: GraphQLString},
        content: {type: GraphQLString}
      },
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload(input, root) {
        assertUser(root);
        input.conceptID = fromGlobalId(input.conceptID).id;
        return Explanation.create(input).then(() => ({success: true}));
      }
    }),
    deleteExplanation: mutationWithClientMutationId({
      name: 'DeleteExplanation',
      inputFields: {
        explanationID: {type: new GraphQLNonNull(GraphQLID)}
      },
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload(input, root) {
        assertUser(root);
        return Explanation.delete(fromGlobalId(input.explanationID).id)
          .then(() => ({success: true}));
      }
    }),
    voteExplanation: mutationWithClientMutationId({
      name: 'VoteExplanation',
      inputFields: {
        explanationID: {type: new GraphQLNonNull(GraphQLID)},
        voteType: {type: new GraphQLEnumType({
          name: 'voteType',
          values: {'UP':{}, 'DOWN':{}}
        })}
      },
      outputFields: {
        explanation: {type: new GraphQLNonNull(ExplanationType)}
      },
      mutateAndGetPayload({explanationID, voteType}, root) {
        assertUser(root);
        const userID = root.rootValue.user.id;
        return Explanation.vote(fromGlobalId(explanationID).id, voteType, userID)
          .then((explanation) => ({explanation}))
      }
    })
  }
};
