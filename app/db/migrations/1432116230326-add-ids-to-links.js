import uuid from 'node-uuid';

import {db, query} from '../connection';

export default {

  up(next) {
    query(
        'MATCH (l:Link) WHERE l.id IS NULL RETURN ID(l) AS id'
    ).then((dbData) => {
          db.cypher(dbData.map((attrs) => {
            return {
              'query': `
              MATCH (l:Link)
              WHERE ID(l) = {internalId}
              SET l.id = {newId}
            `,
              'params': {'internalId': attrs.id, 'newId': uuid.v4()}
            }
          }), next);
        });
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};