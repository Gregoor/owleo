import _ from 'lodash';
import {camelizeKeys} from 'humps';
import sanitizeHtml from 'sanitize-html';

import knex from './knex';

const explanations = () => knex('explanations');

const sanitizeContent = (content) => sanitizeHtml(content, {
  'allowedTags': ['ul', 'li', 'div', 'br', 'ol', 'b', 'i', 'u', 'img']
});

export default {

  find(params = {}, userID) {
    const query = explanations()
      .where(_.pick(params, 'id', 'concept_id'));

    if (params.approved === false) {
      query.where({approved: false});
    } else {
      query.where(function() {
        this.where({approved: true}).orWhere({author_id: userID});
      });
    }

    return query.orderByRaw('votes DESC, created_at').then((explanations) =>
      explanations.map((explanation) => camelizeKeys(explanation))
    );
  },

  findOne(...args) {
    return this.find(...args).then(([explanation]) => explanation);
  },

  create({conceptID, content, type}, userID) {
    let q =  knex('explanations').insert({
      concept_id: conceptID,
      author_id: userID,
      content: sanitizeContent(content),
      is_link: type == 'link',
      approved: knex('users').select('is_admin').where({id: userID})
    }).returning('id');
    return q;
  },

  update(id, columns) {
    return explanations()
      .update(_.pick(columns, 'content', 'approved'))
      .where({id}).then(() => id);
  },

  delete(id) {
    return explanations().where({id}).delete();
  },

  vote(id, voteType, userID) {
    const ids = {explanation_id: id, user_id: userID};
    const voteCount = (type) => knex(`explanation_${type}_votes`)
      .where({explanation_id: id}).count().toString();
    return knex.transaction((trx) => Promise.all([
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
    ));
  },

  hasVotedFor(id, voteType, userID) {
    return knex(`explanation_${voteType.toLowerCase()}_votes`)
      .where({explanation_id: id, user_id: userID})
      .then((explanations) => Boolean(explanations.length));
  }

};
