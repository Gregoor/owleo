import _ from 'lodash';
import uuid from 'node-uuid';

import {db, query} from './connection';

let subQueries = {
    'votes': `
        MATCH (:User)-[v:VOTED]->(l:Link {id: {id}})
        RETURN COUNT(v) AS votes
    `
};

export default {

    find(id) {
      return query(
          `
            MATCH (l:Link)
            WHERE l.id = {id}

            OPTIONAL MATCH (:User)-[r:VOTED]->(l)

            RETURN l.id AS id, l.name AS name, l.url AS url,
                l.paywalled AS paywalled, COUNT(r) AS votes
          `,
          {id}
      ).then(r => r[0]);
    },

    create(data, conceptId, userId) {
        let id = data.id = uuid.v4();
        return query(
            `
              MATCH (u:User {id: {userId}})
              MATCH (c:Concept {id: {conceptId}})

              CREATE (l:Link {data})
              CREATE u-[:CREATED]->l
              CREATE l-[:EXPLAINS]->c
            `,
            {data, conceptId, userId}
        ).then(() => this.find(id));
    },

    vote(id, userId) {
        return new Promise(resolve => db.cypher([
            {
                'query': `
                    MATCH (l:Link {id: {id}})
                    MATCH (u:User {id: {userId}})
                    MERGE u-[:VOTED]->l
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
                        -[v:VOTED]->(l:Link {id: {id}})
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