import {db, query} from '../connection';

export default {

  up(next) {
    query(
      `
        MATCH (c:Concept)
        OPTIONAL MATCH (c)<-[:CONTAINED_BY*]-(containees:Concept)
        WITH c, COUNT(DISTINCT containees) AS conceptsCount
        SET c.conceptsCount = conceptsCount
      `
    ).then(() => next());
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};
