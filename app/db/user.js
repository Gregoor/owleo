import _ from 'lodash';
import uuid from 'node-uuid';
import bcrypt from 'bcrypt';

import {db, query} from './connection';

export default {

    authenticate(attrs) {
        let {name, password} = attrs;

        return query(
            `
                MATCH (u:User {name: {name}})
                RETURN u.password_hash AS pwHash, u.id AS id
                LIMIT 1
            `,
            {name}
        ).then(dbData => {
            if (_.isEmpty(dbData)) return {'success': false};
            let {pwHash, id} = dbData[0];
            return {'success': bcrypt.compareSync(password, pwHash), id};
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
                {'data': {name,
                    'password_hash': bcrypt.hashSync(password, 12),
                    'id': uuid.v4()
                }}
            ).then(dbData => dbData[0]));
    },

    find({id, name}) {
        return query(
            `
                MATCH (u:User)
                WHERE u.id = {id} OR u.name = {name}
                RETURN u.name AS name, u.admin AS admin
                LIMIT 1
            `,
            {'id': id || null, 'name': name || null}
        ).then(dbData => dbData[0])
    }

};