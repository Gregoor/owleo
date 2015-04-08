let _ = require('lodash');

let Controller = require('./controller');
let search = require('../db/search');

export default class SearchController extends Controller {

	go() {
		return search(this.params);
	}

}