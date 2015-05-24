import _ from 'lodash';
import statusCodes from 'http-status-codes';

import Controller from './controller';
import Concept from '../db/concept';

let conceptParams = (params) => {
	return _.pick(params.concept,
		'name', 'summary', 'summarySource', 'color',
        'container', 'reqs', 'tags',  'links'
	);
};

let openActions = ['all', 'find'];

export default class ConceptControler extends Controller {

    before(actionName) {
        return _.includes(openActions, actionName) ?
            Promise.resolve(true) :
            this.user().then(user => user && user.admin);
    }

	all() {
		return Concept.all()
	}

	find(id) {
		return this.user().then(user => {
			return Concept.find(user, id).then(concept => {
				return concept || statusCodes.NOT_FOUND;
			});
		});

	}

	create() {
		return this.user().then(user => {
			return Concept.create(user, conceptParams(this.params));
		});
	}

	update(id) {
		return Concept.update(id, conceptParams(this.params));
	}

	delete(id) {
		return Concept.delete(id);
	}

	reposition() {
		return Concept.reposition(this.params.concepts);
	}

}