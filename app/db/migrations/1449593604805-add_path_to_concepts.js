import {db, query} from '../connection';

export default {

  up(next) {
    query(
      `
        MATCH (c:Concept)
        OPTIONAL MATCH (c)-[:CONTAINED_BY*0..]->(containers:Concept)
        WITH c, COLLECT(DISTINCT containers.name) AS path
        SET c.path = path
      `
    ).then(() => next());
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};
