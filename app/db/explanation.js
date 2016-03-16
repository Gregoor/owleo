import _ from 'lodash';
import {camelizeKeys} from 'humps';
import sanitizeHtml from 'sanitize-html';

import knex from './knex';

const sanitizeContent = (content) => sanitizeHtml(content, {
  'allowedTags': ['ul', 'li', 'div', 'br', 'ol', 'b', 'i', 'u', 'img']
});

export default {

  find(params = {}) {
    return knex('explanations').where(_.pick(params, 'id', 'concept_id'))
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
    return knex('explanations').update({content}).where({id}).then(() => id);
  },

  delete(id) {
    return knex('explanations').where({id}).delete();
  }

};
