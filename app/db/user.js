import _ from 'lodash';
import {camelizeKeys} from 'humps';
import bcrypt from 'bcrypt-nodejs';

import knex from './knex';

const users = () => knex('users');

export default {

  authenticate({name, password}) {
    return users().select('id', 'password_hash').where({name}).limit(1)
      .then(([{id, password_hash}]) => 
        bcrypt.compareSync(password, password_hash) ? {id, name} : null
      );
  },

  createGuest() {
    return users().insert({is_guest: true}).returning('id').then(([id]) => id);
  },

  registerGuest(id, {name, password}) {
    return this.find({name}).then((user) => {
      if (user) throw 'exists';
      const password_hash = bcrypt.hashSync(password, 12);
      return users().where({id}).update({name, password_hash, is_guest: false});
    });
  },

  find(params) {
    return users().select().where(_.pick(params, 'id', 'user')).limit(1)
      .then(([u]) => camelizeKeys(u));
  }

};
