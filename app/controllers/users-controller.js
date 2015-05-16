import _ from 'lodash';
import statusCodes from 'http-status-codes';

import Controller from './controller';
import User from '../db/user';

let authParams = (params) => {
    return _.pick(params.user, 'name', 'password');
};

export default class UserController extends Controller {

    exists() {
        return User.find({'name': this.params.name}).then(user => {
           return {'exists': Boolean(user)};
        });
    }

    current() {
        return this.user();
    }

	login() {
        return User.authenticate(authParams(this.params))
            .then(({success, id}) => {
                if (success) {
                    this.setUserId(id);
                    return this.current();
                } else return statusCodes.UNAUTHORIZED;
            });
	}

    register() {
        return User.create(authParams(this.params)).then(({error, id}) => {
            if (error && _.includes(error, 'exists')) return statusCodes.CONFLICT;
            else {
                this.setUserId(id);
                return this.current();
            }
        });
    }

    logout() {
        this.setUserId(null);
        return Promise.resolve(null);
    }

}