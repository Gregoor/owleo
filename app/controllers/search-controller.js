import _ from 'lodash';

import Controller from './controller';
import search from '../db/search';

export default class SearchController extends Controller {

  go() {
    return search(this.params);
  }

}
