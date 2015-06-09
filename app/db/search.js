import _ from 'lodash';

import {db} from './connection';
import Concept from './concept';
import Tag from './tag';

export default (params) => {
  params = _.defaults(params, {
    'for': ['Concept', 'Tag'],
    'q': '',
    'tags': []
  });

  let queries = [];
  for (let node of params.for) {
    let p = _.cloneDeep(params);
    queries.push(node == 'Concept' ? Concept.search(p) : Tag.search(p));
  }

  return new Promise((resolve) => db.cypher(queries, (err, results) => {
    if (err) console.error(results);
    results = results.reduce((all, result, i) => {
      let type = params.for[i];
      result.forEach((n) => n.type = type);
      return all.concat(result);
    }, []);
    resolve(results);
  }));
}
