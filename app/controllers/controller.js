import _ from 'lodash';

import User from '../db/user';

export default class Controller {

    constructor(obj) {
        _.assign(this, obj);
    }

    user() {
        let {id} = this.req.user;
        if (this._user !== undefined) return Promise.resolve(this._user);
        if (!id) return Promise.resolve(this._user = null);
        return new Promise(resolve => User.find({id}).then(user => {
            resolve(this._user = user);
        }));
    }

}