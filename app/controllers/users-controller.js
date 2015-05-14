import _ from 'lodash';
import statusCodes from 'http-status-codes';

import User from '../db/user';

let loginParams = (params) => {
    return _.pick(params.user, 'id', 'password');
};

let registerParams = (params) => {
    return _.pick(params.user, 'name', 'password');
};

export default class UserController {

	login() {
        return User.authenticate(loginParams(this.params))
            .then(({success, id}) => {
                if (success) this.user.id = id;
                return {success};
            });
	}

    register() {
        return User.create(registerParams(this.params)).then(({error, id}) => {
            if (error && _.includes(error, 'exists')) return statusCodes.CONFLICT;
            else return {id};
        });
    }

}