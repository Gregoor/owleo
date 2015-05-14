import _ from 'lodash';
import statusCodes from 'http-status-codes';

import Controller from './controller';
import User from '../db/user';

let loginParams = (params) => {
    return _.pick(params.user, 'id', 'password');
};

let registerParams = (params) => {
    return _.pick(params.user, 'name', 'password');
};

export default class UserController extends Controller {

	login() {
        return User.authenticate(loginParams(this.params))
            .then(({success, id}) => {
                let status;
                if (success) this.user.id = id;
                else status = statusCodes.UNAUTHORIZED;
                return {'body': {success}, status};
            });
	}

    register() {
        return User.create(registerParams(this.params)).then(({error, id}) => {
            if (error && _.includes(error, 'exists')) return statusCodes.CONFLICT;
            else return {id};
        });
    }

}