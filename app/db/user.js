import _ from 'lodash';
import uuid from 'node-uuid';
import bcrypt from 'bcrypt';

import {db, query} from './connection';

export default {

  authenticate({name, password}) {
    return query(
      `
        MATCH (u:User {name: {name}})
        RETURN u.id AS id, u.password_hash AS pwHash
        LIMIT 1
      `,
      {name}
    ).then(dbData => {
        if (_.isEmpty(dbData)) return null;
        let {pwHash, id} = dbData[0];
        return bcrypt.compareSync(password, pwHash) ? {id, name} : null;
      });
  },

  create(attrs) {
    let {name, password} = attrs;

    return this.find({name}).then(exists => exists ?
    {'error': ['exists']} :
      query(
        `
          CREATE (u:User {data})
          RETURN u.id AS id
        `,
        {
          'data': {
            name,
            'password_hash': bcrypt.hashSync(password, 12),
            'id': uuid.v4()
          }
        }
      ).then(dbData => dbData[0]));
  },

  find({id = null, name = null}) {
    return query(
      `
        MATCH (u:User)
        WHERE u.id = {id} OR u.name = {name}
        RETURN u.id AS id, u.name AS name, u.admin AS admin
        LIMIT 1
      `,
      {id, name}
    ).then(([user]) => user)
  }

};
