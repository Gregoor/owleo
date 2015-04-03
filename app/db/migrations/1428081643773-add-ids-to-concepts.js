let uuid = require('node-uuid');

let {db, query} = require('../connection');

export default {

  up(next) {
    query(
      'MATCH (c:Concept) WHERE c.id IS NULL RETURN ID(c) AS id'
    ).then((dbData) => {
        db.cypher(dbData.map((attrs) => {
          return {
            'query': `
              MATCH (c:Concept)
              WHERE ID(c) = {internalId}
              SET c.id = {newId}
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