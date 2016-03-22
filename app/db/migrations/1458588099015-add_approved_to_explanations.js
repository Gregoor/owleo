import knex from '../knex';

export default {

  up(next) {
    knex.raw(
      'ALTER TABLE explanations ADD approved BOOL NOT NULL DEFAULT FALSE'
    ).then(() =>
      knex('explanations').update({approved: true})
    ).then(() => next());
  },

  down(next) {
    knex('explanations').dropColumn('approved').then(() => next());
  }

}
