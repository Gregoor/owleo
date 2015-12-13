import {db, query} from '../connection';

export default {

  up(next) {
    query(
      `
        MATCH (c:Concept)
        SET c.path = NULL
      `
    ).then(() => next());
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};
