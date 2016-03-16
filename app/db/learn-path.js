import {camelizeKeys} from 'humps';

import knex from './knex';

const findLearnPath = (id, {includeContained}) => {
  return knex.raw(`
    WITH RECURSIVE all_requirments AS (
      SELECT concepts.*
      FROM concepts
      WHERE id = ?
      UNION
      SELECT concepts.*
      FROM concepts, requirements, all_requirments
      WHERE concepts.id = requirements.requirement_id AND
            requirements.concept_id = all_requirments.id
    )
    SELECT * FROM all_requirments;
  `, [id]).then(({rows}) => rows.reverse().map(camelizeKeys));
};

export default findLearnPath;
