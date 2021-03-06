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
  connectionDefinitions, connectionFromPromisedArray, connectionArgs
} from 'graphql-relay';
import _ from 'lodash';

import findLearnPath from '../db/learn-path';
import Concept from '../db/concept';
import User from '../db/user';
import Explanation from '../db/explanation';
import NodeGQL from './node-gql';
import UserGQL from './user-gql';


let ExplanationType = new GraphQLObjectType({
  name: 'Explanation',
  fields: () => ({
    id: globalIdField('Explanation'),
    type: {
      type: GraphQLString,
      resolve: ({isLink}) => isLink ? 'link' : 'text'
    },
    content: {type: GraphQLString},
    votes: {type: GraphQLInt},
    hasUpvoted: {
      type: GraphQLBoolean,
      resolve({id}, args, context) {
        return context.getUser().then(({id: userID}) => {
          return Explanation.hasVotedFor(id, 'UP', userID);
        });
      }
    },
    hasDownvoted: {
      type: GraphQLBoolean,
      resolve({id}, args, context) {
        return context.getUser().then(({id: userID}) => {
          return Explanation.hasVotedFor(id, 'DOWN', userID);
        });
      }
    },
    author: {type: UserGQL.type},
    approved: {type: GraphQLBoolean},
    concept: {
      type: ConceptType,
      resolve: ({conceptId: id}) => Concept.findOne({id})
    }
  })
});

let {connectionType: explanationConnection, edgeType: explanationEdge} =
  connectionDefinitions({name: 'Explanation', nodeType: ExplanationType});


const ConceptType = new GraphQLObjectType({
  name: 'Concept',
  fields: () => ({
    id: globalIdField('Concept'),
    name: {type: GraphQLString},
    summary: {type: GraphQLString},
    summarySource: {type: GraphQLString},
    conceptsCount: {type: GraphQLInt},
    container: {
      type: ConceptType,
      resolve: ({containerId}) => Concept.findOne({id: containerId})
    },
    path: {
      type: new GraphQLList(ConceptType),
      resolve: ({containerId}) => Concept.retrievePath(containerId)
    },
    concepts: {
      type: new GraphQLList(ConceptType),
      resolve: ({id}) => Concept.find({container_id: id})
    },
    reqs: {
      type: new GraphQLList(ConceptType),
      resolve: ({id}) => id ? Concept.find({requiredBy: id}) : null
    },
    explanationsCount: {type: GraphQLInt},
    explanations: {
      type: explanationConnection,
      args: connectionArgs,
      resolve: ({id}, args, context) => context.getUser().then((user) =>
        connectionFromPromisedArray(
          Explanation.find({concept_id: id}, user.id),
          args
        )
      )
  },
    mastered: {
      type: GraphQLBoolean,
      resolve: ({id}, args, context) => {
        return context.getUser().then(({id: userID}) =>
          Concept.isMasteredBy(id, userID)
        );
      }
    },
    learnPath: {
      type: new GraphQLList(ConceptType),
      args: {
        includeContained: {type: GraphQLBoolean},
        mastered: {type: GraphQLBoolean}
      },
      resolve({id}, {includeContained, mastered}) {
        return id ? findLearnPath(id, {includeContained, mastered}) : null;
      }
    }
  }),
  interfaces: [NodeGQL.interface]
});

const assertUser = (context) => context.getUser().then(({isGuest}) => {
  if (isGuest) throw new Error('unauthorized');
});
const assertAdmin = (context) => context.getUser().then(({isAdmin}) => {
  if (!isAdmin) throw new Error('unauthorized');
});

export default {
  type: ConceptType,
  queries: {
    concept: {
      type: ConceptType,
      args: {
        id: {type: GraphQLString},
        fetchContainerIfEmpty: {type: GraphQLBoolean},
        returnEmpty: {type: GraphQLBoolean}
      },
      resolve(root, args) {
        const {id, returnEmpty, fetchContainerIfEmpty} = args;
        if (!id) return returnEmpty ? {id: null} : null;
        return Concept.findOne({id}).then((concept) => {
          if (concept.conceptsCount == 0 && fetchContainerIfEmpty) {
            const {containerId} = concept;
            return containerId ? Concept.findOne({id: containerId}) : {id: null};
          } else return concept;
        });
      }
    },
    concepts: {
      type: new GraphQLList(ConceptType),
      args: {
        query: {type: GraphQLString},
        limit: {type: GraphQLInt},
        exclude: {type: new GraphQLList(GraphQLString)}
      },
      resolve(root, args) {
        if (args.exclude) {
          args.exclude = args.exclude.map(id => fromGlobalId(id).id);
        }
        return Concept.find(args);
      }
    },
    unapproved: {
      type: new GraphQLObjectType({
        name: 'Unapproved',
        fields: {
          explanations: {
            type: new GraphQLList(ExplanationType),
            resolve(parent, args, root) {
              return assertAdmin(root).then(() =>
                Explanation.find({approved: false})
              );
            }
          }
        }
      }),
      resolve: () => ({})
    }
  },
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
      mutateAndGetPayload: (input, context) => {
        if (input.container) {
          input.container = fromGlobalId(input.container).id;
        }
        if (input.reqs) {
          input.reqs = input.reqs.map(req => fromGlobalId(req).id);
        }
        return assertAdmin(context)
          .then(() => context.getUser())
          .then((user) => Concept.create(input, user.id))
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
      mutateAndGetPayload: (input, context) => {
        input.id = fromGlobalId(input.id).id;
        if (input.container) {
          input.container = fromGlobalId(input.container).id;
        }
        if (input.reqs) {
          input.reqs = input.reqs.map(req => fromGlobalId(req).id);
        }
        return assertAdmin(context)
          .then(() => Concept.update(input.id, input))
          .then(() => ({success: true}));
      }
    }),
    deleteConcept: mutationWithClientMutationId({
      name: 'DeleteConcept',
      inputFields: {conceptID: {type: new GraphQLNonNull(GraphQLID)}},
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload(input, context) {
        return assertAdmin(context)
          .then(() => Concept.delete(fromGlobalId(input.conceptID).id))
          .then(() => ({success: true}));
      }
    }),
    masterConcept: mutationWithClientMutationId({
      name: 'MasterConcept',
      inputFields: {
        conceptIDs: {type: new GraphQLList(GraphQLID)},
        mastered: {type: new GraphQLNonNull(GraphQLBoolean)}
      },
      outputFields: {
        concepts: {type: new GraphQLList(ConceptType)},
        user: {type: UserGQL.type}
      },
      mutateAndGetPayload(input, context) {
        const {conceptIDs, mastered} = input;
        const ids = conceptIDs.map((id) => fromGlobalId(id).id);
        return context.getUser().then(({id: userID}) => {
            return (mastered ?
              Concept.master(ids, userID) :
              Concept.unmaster(ids, userID)
            ).then(() => Promise.all([
              Concept.find({ids}),
              User.findOne({id: userID})
            ]));
          })
          .then(([concepts, user]) => ({concepts, user}));
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
      mutateAndGetPayload(input, context) {
        input.conceptID = fromGlobalId(input.conceptID).id;

        return assertUser(context)
          .then(() => context.getUser())
          .then((user) => Explanation.create(input, user.id))
          .then(() => ({success: true}));
      }
    }),
    updateExplanation: mutationWithClientMutationId({
      name: 'UpdateExplanation',
      inputFields: {
        explanationID: {type: new GraphQLNonNull(GraphQLID)},
        content: {type: GraphQLString},
        approved: {type: GraphQLBoolean}
      },
      outputFields: {explanation: {type: ExplanationType}},
      mutateAndGetPayload(input, context) {
        const explanationID = fromGlobalId(input.explanationID).id;
        return assertAdmin(context)
          .then(() =>
            Explanation.update(explanationID, _.pick(input, 'content', 'approved'))
          ).then(() => Explanation.find({id: explanationID}))
          .then(([explanation]) => ({explanation}));
      }
    }),
    deleteExplanation: mutationWithClientMutationId({
      name: 'DeleteExplanation',
      inputFields: {
        explanationID: {type: new GraphQLNonNull(GraphQLID)}
      },
      outputFields: {success: {type: GraphQLBoolean}},
      mutateAndGetPayload(input, context) {
        return assertAdmin(context)
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
      mutateAndGetPayload({explanationID, voteType}, context) {
        explanationID = fromGlobalId(explanationID).id;
        return assertUser(context)
          .then(context.getUser)
          .then(({id: userID}) => {
            return Explanation.vote(explanationID, voteType, userID)
              .then((userID) => ({
                explanation: Explanation.findOne({id: explanationID}, userID)
              }));
          });
      }
    })
  }
};
