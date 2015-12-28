import {db, query} from '../connection';

export default {

  up(next) {
    query(
      `
        MATCH (c:Concept)-[:CONTAINED_BY]->(container:Concept)
        MERGE (c)-[:REQUIRES]->(container)
      `
    ).then(() => next());
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};
