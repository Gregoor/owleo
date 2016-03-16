import uuid from 'node-uuid';
import bcrypt from 'bcrypt-nodejs';

import {db} from '../connection';

export default {

  up(next) {
      db.cypher(['max', 'gregor'].map(name => {
          let password = Math.random().toString(36).slice(-8);
          console.log(`Password for ${name}: ${password}`);
          return {
              'query': 'CREATE (:User {data})',
              'params': {'data': {
                  name,
                  'admin': true,
                  'id': uuid.v4(),
                  'password_hash': bcrypt.hashSync(password, 12)
              }}
          }
      }), () => next());
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};
