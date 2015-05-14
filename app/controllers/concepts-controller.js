import _ from 'lodash';

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
        if (!_.includes(openActions, actionName)) {
            return this.user().then(user => {
                return !!user;
            });
        }
		return Promise.resolve(true);
    }

	all() {
		return Concept.all()
	}

	find(id) {
		return new Promise(resolve => Concept.find(id).then(concept => {
			if (concept) resolve(concept);
			else resolve({
				'body': {'error': 'No concept found for that id'},
				'status': 404
			});
		}));
	}

	create() {
		return Concept.create(conceptParams(this.params));
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