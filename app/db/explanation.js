import _ from 'lodash';
import {camelizeKeys} from 'humps';
import sanitizeHtml from 'sanitize-html';

import knex from './knex';

const explanations = () => knex('explanations');

const sanitizeContent = (content) => sanitizeHtml(content, {
  'allowedTags': ['ul', 'li', 'div', 'br', 'ol', 'b', 'i', 'u', 'img']
});

export default {

  find(params = {}) {
    return explanations().where(_.pick(params, 'id', 'concept_id'))
      .then((explanations) => explanations.map(camelizeKeys));
  },

  findOne(...args) {
    return this.find(...args).then(([explanation]) => explanation);
  },

  create({conceptID, content, type}, userID) {
    let q =  knex('explanations').insert({
      concept_id: conceptID,
      author_id: userID,
      content: sanitizeContent(content),
      is_link: type == 'link'
    }).returning('id');
    return q;
  },

  update(id, content) {
    return explanations().update({content}).where({id}).then(() => id);
  },

  delete(id) {
    return explanations().where({id}).delete();
  },

  vote(id, voteType, userID) {
    const ids = {explanation_id: id, user_id: userID};
    const voteCount = (type) => knex(`explanation_${type}_votes`)
      .where({explanation_id: id}).count().toString();
    return knex.transaction((trx) =>
      Promise.all([
        knex('explanation_up_votes').transacting(trx).where(ids).delete(),
        knex('explanation_down_votes').transacting(trx).where(ids).delete()
      ]).then(() =>
        voteType ?
          knex(`explanation_${voteType.toLowerCase()}_votes`).transacting(trx)
            .insert(ids) :
          Promise.resolve()
      ).then(() =>
        explanations().transacting(trx).where({id}).update('votes', knex.raw(
          `(${voteCount('up')}) - (${voteCount('down')})`
        ))
      )
    );
  },

  hasVotedFor(id, voteType, userID) {
    return knex(`explanation_${voteType.toLowerCase()}_votes`)
      .where({explanation_id: id, user_id: userID})
      .then((explanations) => Boolean(explanations.length));
  }

};
