import _ from 'lodash';
import uuid from 'node-uuid';
import sanitizeHtml from 'sanitize-html';

import {db, query} from './connection';

let subQueries = {
  'votes': `
    MATCH (:User)-[v:VOTED]->(l:Explanation {id: {id}})
    RETURN COUNT(v) AS votes
  `
};

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

  create(data) {//, userId) {
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
        MATCH (c:Concept {id: {conceptId}})

        CREATE u-[:CREATED]->(e:Explanation {attrs})-[:EXPLAINS]->c
      `,
      {attrs, conceptId: data.conceptId}//, userId}
    ).then(() => attrs.id);
  },

  vote(id, userId) {
    return new Promise(resolve => db.cypher([
      {
        'query': `
          MATCH (e:Explanation {id: {id}})
          MATCH (u:User {id: {userId}})
          MERGE u-[:VOTED]->e
        `,
        'params': {id, userId}
      },
      {
        'query': subQueries.votes,
        'params': {id}
      }
    ], (n, r) => resolve(r[1][0])));
  },

  unvote(id, userId) {
    return new Promise(resolve => db.cypher([
      {
        'query': `
          MATCH (u:User {id: {userId}})
            -[v:VOTED]->(e:Explanation {id: {id}})
          DELETE v
        `,
        'params': {id, userId}
      },
      {
        'query': subQueries.votes,
        'params': {id}
      }
    ], (n, r) => resolve(r[1][0])));
  }

};
