import _ from 'lodash';
import uuid from 'node-uuid';
import sanitizeHtml from 'sanitize-html';

import {db, query} from './connection';

export default {

  find({id}) {
    let fields = ['id', 'type', 'content', 'paywalled', 'createdAt']
      .map(f => `e.${f} AS ${f}`).join(', ');
    return query(
      `
        MATCH (e:Explanation {id: {id}})
        RETURN ${fields}
      `,
      {id}
    )
  },

  create(data) {//, userID) {
    let attrs = Object.assign({
      id: uuid.v4(),
      content: sanitizeHtml(data.content, {
        'allowedTags': ['ul', 'li', 'div', 'br', 'ol', 'b', 'i', 'u']
      }),
      createdAt: Date.now()
    }, _.pick(data, 'type', 'paywalled'));
    return query(
      `
        MATCH (u:User {name: "gregor"})
        MATCH (c:Concept {id: {conceptID}})

        CREATE u-[:CREATED]->(e:Explanation {attrs})-[:EXPLAINS]->c
      `,
      {attrs, conceptID: data.conceptID}//, userID}
    ).then(() => attrs.id);
  },

  vote(id, voteType, userID) {
    const params = {id, userID};

    let queries = [{
      query: `
          MATCH (e:Explanation {id: {id}}), (u:User {id: {userID}})
          OPTIONAL MATCH u-[upvote:UPVOTED]->e
          OPTIONAL MATCH u-[downvote:DOWNVOTED]->e
          DELETE upvote, downvote
        `,
      params
    }];

    if (['UP', 'DOWN'].includes(voteType)) queries.push({
      query: `
        MATCH (e:Explanation {id: {id}}), (u:User {id: {userID}})
        CREATE u-[:${voteType}VOTED]->e
      `,
      params
    });

    queries.push({
      query: `
        MATCH (e:Explanation {id: {id}}), (u:User {id: {userID}})

        OPTIONAL MATCH u-[upvote:UPVOTED]->e
        WITH e, u, COUNT(DISTINCT upvote) AS hasUpvoted
        OPTIONAL MATCH u-[downvote:DOWNVOTED]->e
        WITH e, hasUpvoted, COUNT(DISTINCT downvote) AS hasDownvoted

        OPTIONAL MATCH (:User)-[upvotes:UPVOTED]->e
        OPTIONAL MATCH (:User)-[downvotes:DOWNVOTED]->e
        WITH e, hasUpvoted, hasDownvoted,
          COUNT(upvotes) - COUNT(downvotes) AS votes

        RETURN {
          id: e.id, type: e.type, content: e.content, votes: votes,
          hasUpvoted: hasUpvoted, hasDownvoted: hasDownvoted
        } AS explanation
      `,
      params
    });


    return new Promise((resolve, reject) => db.cypher(queries, (error, results) => {
      if (error) {
        console.error(error);
        reject();
      } else resolve(results[results.length - 1][0].explanation);
    }));
  },

  delete(id) {
    return query(
      `
        MATCH (e:Explanation {id: {id}})
        OPTIONAL MATCH (e)-[r]-()
        DELETE e, r
      `,
      {id}
    );
  }

};
