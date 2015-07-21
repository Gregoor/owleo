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

  create(data, conceptId, userId) {
    let id = data.id = uuid.v4();
    let sanitizedContent = sanitizeHtml(data.content, {
      'allowedTags': ['ul', 'li', 'div', 'br', 'ol', 'b', 'i', 'u']
    });
    if (sanitizedContent != data.content) return Promise.reject('XSS');
    data.createdAt = Date.now();
    return query(
      `
        MATCH (u:User {id: {userId}})
        MATCH (c:Concept {id: {conceptId}})

        CREATE u-[:CREATED]->(e:Explanation {data})-[:EXPLAINS]->c
      `,
      {data, conceptId, userId}
    );
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
