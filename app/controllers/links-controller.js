import _ from 'lodash';
import statusCodes from 'http-status-codes';

import Controller from './controller';
import Link from '../db/link';

let linkParams = (params) => {
	return _.pick(params.link, 'paywalled', 'url', 'name');
};

export default class ConceptControler extends Controller {

    before() {
        return this.user().then(user => Boolean(user));
    }

	create(conceptId) {
		return this.user()
            .then(user => {
                let data = linkParams(this.params);
                return Link.create(data, conceptId, user.id);
            });

	}

	vote(conceptId, id) {
		return this.user().then(user => {
            return Link.vote(id, user.id);
        });
	}

    unvote(conceptId, id) {
        return this.user().then(user => {
            return Link.unvote(id, user.id);
        });
    }

}