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
import User from '../db/user';
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
        const fields = getFieldList(context);
        return context.rootValue.getUser().then(({id}) => {
          return Concept.find(args, fields, id)
        });
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

const assertUser = (root) => root.rootValue.getUser().then(({isGuest}) => {
  if (isGuest) throw new Error('unauthorized');
});

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
        if (input.container) {
          input.container = fromGlobalId(input.container).id;
        }
        if (input.reqs) {
          input.reqs = input.reqs.map(req => fromGlobalId(req).id);
        }
        return assertUser(root)
          .then(() => Concept.create(input))
          .then(id => ({conceptID: toGlobalId('Concept', id)}));
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
        input.id = fromGlobalId(input.id).id;
        if (input.container) {
          input.container = fromGlobalId(input.container).id;
        }
        if (input.reqs) {
          input.reqs = input.reqs.map(req => fromGlobalId(req).id);
        }
        return assertUser(root)
          .then(() => Concept.update(input.id, input))
          .then(() => ({success: true}));
      }
    }),
    deleteConcept: mutationWithClientMutationId({
      name: 'DeleteConcept',
      inputFields: {conceptID: {type: new GraphQLNonNull(GraphQLID)}},
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload(input, root) {
        return assertUser(root)
          .then(() =>Concept.delete(fromGlobalId(input.conceptID).id))
          .then(() => ({success: true}));
}
    }),
    masterConcept: mutationWithClientMutationId({
      name: 'MasterConcept',
      inputFields: {
        conceptID: {type: new GraphQLNonNull(GraphQLID)},
        mastered: {type: new GraphQLNonNull(GraphQLBoolean)}
      },
      outputFields: {
        concept: {type: ConceptType},
        user: {type: UserGQL.type}
      },
      mutateAndGetPayload(input, root) {
        const {conceptID, mastered} = input;
        const {id} = fromGlobalId(conceptID);
        return root.rootValue.getUser().then(({id: userID}) => {
            const fields = getFieldList(root);
            return Concept.master(id, userID, mastered)
              .then(() => Promise.all([
                Concept.find({id}, fields.concept, userID),
                User.find({id: userID}, fields.user)
              ]));
          })
          .then(([[concept], user]) => ({concept, user}));
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
        input.conceptID = fromGlobalId(input.conceptID).id;
        return assertUser(root)
          .then(() => Explanation.create(input))
          .then(() => ({success: true}));
      }
    }),
    updateExplanation: mutationWithClientMutationId({
      name: 'UpdateExplanation',
      inputFields: {
        explanationID: {type: new GraphQLNonNull(GraphQLID)},
        type: {type: GraphQLString},
        content: {type: GraphQLString}
      },
      outputFields: {explanation: {type: ExplanationType}},
      mutateAndGetPayload(input, root) {
        const explanationID = fromGlobalId(input.explanationID).id;
        const data = _.pick(input, 'type', 'content');
        return assertUser(root)
          .then(() => Explanation.update(explanationID, data))
          .then(() => Explanation.find({id: explanationID}))
          .then(([explanation]) => ({explanation}));
      }
    }),
    deleteExplanation: mutationWithClientMutationId({
      name: 'DeleteExplanation',
      inputFields: {
        explanationID: {type: new GraphQLNonNull(GraphQLID)}
      },
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload(input, root) {
        return assertUser(root)
          .then(() => Explanation.delete(fromGlobalId(input.explanationID).id))
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
        explanationID = fromGlobalId(explanationID).id;
        return assertUser(root)
          .then(root.rootValue.getUser)
          .then(({id: userID}) => Explanation.vote(explanationID, voteType, userID))
          .then((explanation) => ({explanation}));
      }
    })
  }
};
