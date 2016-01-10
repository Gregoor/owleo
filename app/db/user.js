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

  createGuest() {
    const id = uuid.v4();
    return query('CREATE (u:User {data})', {data: {id, isGuest: true}})
      .then(() => id);
  },

  registerGuest(id, attrs) {
    const {name, password} = attrs;

    return this.find({name})
      .then(exists => {
        if (exists) throw 'exists';
        const password_hash = bcrypt.hashSync(password, 12);
        return query(
          `
            MATCH (u:User {id: {id}})
            SET u = {data}
          `,
          {id, data: {id, name, password_hash, isGuest: false}}
        )
      });
  },

  find({id = null, name = null}) {
    const fields = ['id', 'name', 'admin', 'isGuest']
      .map(f => `u.${f} AS ${f}`)
      .join(', ');

    return query(
      `
        MATCH (u:User)
        WHERE u.id = {id} OR u.name = {name}
        OPTIONAL MATCH (u)-[:MASTERED]->(c:Concept)
        RETURN ${fields}, COUNT(DISTINCT c) AS masteredConceptsCount
        LIMIT 1
      `,
      {id, name}
    ).then(([user]) => user)
  }

};
