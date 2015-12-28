import {db, query} from '../connection';

export default {

  up(next) {
    query(
      `
        MATCH (c:Concept)-[:REQUIRES]->(req:Concept)
        WITH c, COLLECT(DISTINCT req.id) AS reqs
        MATCH (c1:Concept)-[:REQUIRES*]->(c2:Concept)
        WHERE c1.id IN reqs AND c2.id IN reqs
        MATCH (c)-[r:REQUIRES]->(c2)
        DELETE r
      `
    ).then(() => next());
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};
