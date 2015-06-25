import _ from 'lodash';
import statusCodes from 'http-status-codes';

import Controller from './controller';
import Explanation from '../db/explanation';

let explanationParams = params => {
  return _.pick(params.explanation, 'paywalled', 'content', 'title');
};

export default class ConceptControler extends Controller {

  before() {
    return this.user().then(user => Boolean(user));
  }

  create(conceptId) {
    return this.user()
      .then(user => {
        let data = explanationParams(this.params);
        return Explanation.create(data, conceptId, user.id);
      });

  }

  vote(conceptId, id) {
    return this.user().then(user => {
      return Explanation.vote(id, user.id);
    });
  }

  unvote(conceptId, id) {
    return this.user().then(user => {
      return Explanation.unvote(id, user.id);
    });
  }

}
