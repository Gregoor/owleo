import {query} from './connection';
import _ from 'lodash';

const findLearnPath = (id) => {
  return query(
    `
      MATCH (c:Concept {id: {id}})-[:REQUIRES|CONTAINED_BY*0..]->(reqs)
      WITH COLLECT(reqs.id) AS reqs
      RETURN reqs
    `,
    {id}
  ).then(([{reqs}]) => _(reqs).reverse().uniq().value());
};

export default findLearnPath;
