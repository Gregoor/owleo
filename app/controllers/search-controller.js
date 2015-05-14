import _ from 'lodash';

import search from '../db/search';

export default class SearchController {

	go() {
		return search(this.params);
	}

}