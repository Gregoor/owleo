let _ = require('lodash');

let Controller = require('./controller');
let Concept = require('../db/concept');

let conceptParams = (params) => {
	return _.pick(params.concept,
		'name', 'summary','summarySource','color', 'container', 'reqs', 'tags',
		'links'
	);
};

export default class ConceptControler extends Controller {

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