import _ from 'lodash';
import uuid from 'node-uuid';
import bcrypt from 'bcrypt';

import {db, query} from './connection';

export default {

    authenticate(attrs) {
        let {id, password} = attrs;

        return query(
            `
                MATCH (u:User {id: {id}})
                RETURN u.password_hash AS pwHash
                LIMIT 1
            `,
            {id}
        ).then(dbData => {
            if (_.isEmpty(dbData)) return {'success': false};
            let {pwHash} = dbData[0];
            return {'success': bcrypt.compareSync(password, pwHash), id};
        });
    },

    create(attrs) {
        let {name, password} = attrs;

        return query(
            `
                MATCH (u:User {name: {name}})
                RETURN COUNT(u) > 0 AS exists
            `,
            {name}
        ).then(dbData => {
                let {exists} = dbData[0];
            return new Promise(resolve => {
                resolve(exists ? {'error': ['exists']} : query(
                    `
                        CREATE (u:User {data})
                        RETURN u.id AS id
                    `,
                    {'data': {name,
                        'password_hash': bcrypt.hashSync(password, 10),
                        'id': uuid.v4()
                    }}
                ).then(dbData => dbData[0]));
            });
        });
    }

};