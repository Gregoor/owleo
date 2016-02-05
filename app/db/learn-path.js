import {query} from './connection';
import _ from 'lodash';

const findLearnPath = ({id, includeContained}) => {
  return (includeContained ?
      new Promise((resolve, reject) => {
        query('MATCH (concept:Concept {id: {id}}) RETURN concept', {id})
          .then(([{concept}]) => {
            concept.conceptsCount > 10 ? reject('Too many children') : resolve();
          })
      }) :
      Promise.resolve()
  ).then(() => {
    const matchFor = includeContained ?
      '(:Concept {id: {id}})<-[:CONTAINED_BY*0..]-(c:Concept)' :
      '(c:Concept {id: {id}})';

    return query(
      `
      MATCH ${matchFor}
      MATCH (c)-[:REQUIRES|CONTAINED_BY*0..]->(reqs)
      WITH COLLECT(reqs.id) AS reqs
      RETURN reqs
    `,
      {id}
    ).then(([{reqs}]) => _(reqs).reverse().uniq().value());
  });
};

export default findLearnPath;
