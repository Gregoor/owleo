import _ from 'lodash';
import {camelizeKeys, decamelizeKeys} from 'humps';

import knex from './knex';

const concepts = () => knex('concepts');
const requirements = () => knex('requirements');

const asColumns = (data) => Object.assign(
  decamelizeKeys(_.pick(data, 'name', 'summary', 'summarySource')),
  {container_id: data.container}
);

const recountConcepts = `
  UPDATE concepts AS update_concepts SET concepts_count = (
    WITH RECURSIVE containers AS (
      SELECT concepts.*
      FROM concepts
      WHERE id = update_concepts.id
      UNION
      SELECT concepts.*
      FROM concepts, containers
      WHERE concepts.container_id = containers.id
    )
    SELECT COUNT(*)
    FROM containers
  ) - 1
`;

const filterReqs = ({reqs, container}) => {
  if (container) reqs = [...reqs, container];
  return reqs.length == 0 ? Promise.resolve([]) : knex.raw(`
    WITH RECURSIVE all_requirments AS (
      SELECT id, ARRAY[]::INT[]
        AS reqs
      FROM concepts
      WHERE id IN (${reqs.map((id) => parseInt(id, 10)).join(',')})
      UNION
      SELECT concepts.id, array_append(all_requirments.reqs, concepts.id) AS reqs
      FROM concepts, requirements, all_requirments
      WHERE concepts.id = requirements.requirement_id AND
            requirements.concept_id = all_requirments.id
    )
    SELECT array_agg(reqs) AS reqs
    FROM (
      SELECT DISTINCT unnest(reqs)
      FROM all_requirments
    ) AS dt(reqs);
  `).then(({rows: [{reqs: allReqs}]}) => allReqs ?
    reqs.filter((id) => !allReqs.includes(parseInt(id, 10))) :
    reqs
  );
};

export default {

  find: (params = {}) => {
    let query = knex.select('c.*').from('concepts AS c')
      .where(_.pick(params, 'id', 'container_id'))
      .orderBy('concepts_count', 'desc');

    if (params.ids) query.whereIn('id', params.ids);
    if (_.isString(params.query)) {
      if (params.query.length == 0) {
        query.where(1, '=', 0);
      } else {
        query.where('name', 'ILIKE', `%${params.query}%`);
      }
    }
    if (params.requiredBy) query
      .leftJoin('requirements', 'c.id', 'requirement_id')
      .where({'requirements.concept_id': params.requiredBy});
    if (params.exclude) query.whereNotIn('c.id', params.exclude);
    query.limit(Math.max(params.limit || 30, 30));

    return query.then((concepts) =>
      concepts.map((concept) => camelizeKeys(concept))
    );
  },

  findOne(...args) {
    return this.find(...args).then(([concept]) => concept);
  },

  retrievePath(id) {
    return knex.raw(`
      WITH RECURSIVE containers AS (
        SELECT concepts.*
        FROM concepts
        WHERE id = ?
        UNION
        SELECT concepts.*
        FROM concepts, containers
        WHERE concepts.id = containers.container_id
      )
      SELECT *
      FROM containers;
    `, [id]).then(({rows}) => rows.reverse());
  },

  create(data) {
    return knex.transaction((trx) =>
      concepts().transacting(trx)
        .insert(asColumns(data)).returning('id').then(([id]) => Promise.all([
          filterReqs(data).then((reqs) =>
            requirements().transacting(trx).insert(
              reqs.map((requirement_id) => ({concept_id: id, requirement_id}))
            )
          ),
          knex.raw(recountConcepts)
        ]).then(() => id))
    );
  },

  update(id, data) {
    const concept_id = id;
    return knex.transaction((trx) => Promise.all([
      concepts().transacting(trx).update(asColumns(data)).where({id}),
      requirements().transacting(trx).where({concept_id}).delete(),
      filterReqs(data).then((reqs) => requirements().transacting(trx).insert(
        reqs.map((requirement_id) => ({concept_id, requirement_id}))
      ))
    ])).then(() => knex.raw(recountConcepts)).then(() => id);
  },

  delete(id) {
    return knex.transaction((trx) =>
      requirements().transacting(trx).where({concept_id: id})
        .orWhere({requirement_id: id}).delete().then(() =>
          concepts().transacting(trx).where({id}).delete())
    );
  },

  master(ids, userID) {
    return knex.raw(
      knex('mastered_concepts').insert(
        ids.map((id) => ({concept_id: id, user_id: userID}))
      ).toString() + ' ON CONFLICT (concept_id, user_id) DO NOTHING'
    );
  },

  unmaster(ids, userID) {
    return knex('mastered_concepts')
      .where('user_id', userID).whereIn('concept_id', ids).delete();
  },

  isMasteredBy(id, userID) {
    return knex('mastered_concepts').where({concept_id: id, user_id: userID})
      .count().then(([{count}]) => Boolean(parseInt(count)));
  }

};
