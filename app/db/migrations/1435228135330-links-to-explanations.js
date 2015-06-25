import uuid from 'node-uuid';
import {db, query} from '../connection';

export default {

  up(next) {
    query(
      'MATCH (l:Link) RETURN l.id AS id'
    ).then((dbData) => {
        db.cypher(dbData.map(attrs => {
          return {
            'query': `
              MATCH (l:Link)
              WHERE l.id = {id}
              REMOVE l :Link
              SET l :Explanation
              SET l.content = l.url, l.url = NULL
            `,
            'params': attrs
          }
        }), next);
      });
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};
