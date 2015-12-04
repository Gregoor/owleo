import {db, query} from '../connection';
import pg from 'pg';

import {pgURL} from '../../configs/config.custom';

const createSchema = (pgClient) => new Promise(resolve => pgClient.query(
  `
    CREATE TABLE concepts (
      id             SERIAL PRIMARY KEY,
      name           TEXT NOT NULL,
      summary        TEXT NOT NULL,
      summary_source TEXT NULL,
      old_id         TEXT NOT NULL UNIQUE
    );

    CREATE TABLE requirements (
      id                  SERIAL PRIMARY KEY,
      concept_id          INT NOT NULL REFERENCES concepts,
      required_concept_id INT NOT NULL REFERENCES concepts
    );

    CREATE TABLE container_requirements (
      requirement_id INT NOT NULL REFERENCES requirements ON DELETE CASCADE
    );

    CREATE TABLE explanations (
      id           SERIAL PRIMARY KEY,
      concept_id   INT     NOT NULL REFERENCES concepts,
      content      TEXT    NOT NULL,
      is_link      BOOLEAN NOT NULL,
      is_paywalled BOOLEAN NOT NULL
    );
  `,
  resolve
));

const importConcepts = (pgClient) => {
  return query('MATCH (c:Concept) RETURN COLLECT(c) AS concepts')
    .then(([{concepts}]) => new Promise(resolve => pgClient.query(
      `
        INSERT INTO concepts (old_id, name, summary, summary_source)
        VALUES ${concepts.map(({id, name, summary, summarySource}) => {
          return `(
            ${[id, name, summary || '', summarySource || '']
              .map(c => `'${c.split('\'').join('\'\'')}'`).join(', ')}
          )`;
        }).join(', ')};
      `,
      resolve
    )));
};

const importRequirements = (pgClient) => {
  return query(`
    MATCH (concept:Concept)-[:REQUIRES]->(req:Concept)
    RETURN concept.id AS concept, req.id AS req
  `).then(reqs => new Promise(resolve => pgClient.query(
    reqs.map(({concept, req}) => `
      INSERT INTO requirements (concept_id, required_concept_id)
        SELECT
          (SELECT id FROM concepts WHERE old_id = '${concept}'),
          (SELECT id FROM concepts WHERE old_id = '${req}')
    `).join(';'),
    resolve
  )));
};

const importContainers = (pgClient) => {
  return query(`
    MATCH (concept:Concept)-[:CONTAINED_BY]->(container:Concept)
    RETURN concept.id AS concept, container.id AS container`
  ).then(containers => new Promise(resolve => pgClient.query(
    containers.map(({concept, container}) => `
      WITH req AS (
        INSERT INTO requirements (concept_id, required_concept_id)
          SELECT
            (SELECT id FROM concepts WHERE old_id = '${concept}'),
            (SELECT id FROM concepts WHERE old_id = '${container}')
          RETURNING id
      )
      INSERT INTO container_requirements (requirement_id) SELECT id FROM req
    `).join(';'),
    resolve
  )))
  .then(() => new Promise(resolve => pgClient.query(
    `
      DELETE FROM requirements WHERE id IN (
        SELECT id FROM (
          SELECT
            id,
            ROW_NUMBER()
            OVER (
              PARTITION BY concept_id, required_concept_id
              ORDER BY id ASC
            ) AS row_nr
          FROM requirements
        ) duplicates
        WHERE duplicates.row_nr > 1
      )
    `,
    resolve
  )));
};

const importExplanations = (pgClient) => {
  return query(`
    MATCH (e:Explanation)-[:EXPLAINS]->(c:Concept)
    RETURN c.id AS concept, e AS explanation
  `).then(explanations => new Promise(resolve => pgClient.query(
    `
      INSERT INTO explanations (concept_id, content, is_link, is_paywalled)
        ${explanations.map(({concept, explanation}) => {
          let {content, type, paywalled} = explanation;
          let values = [
            '\'' + content.split('\'').join('\'\'') + '\'',
            type == 'link', Boolean(paywalled)
          ].join(', ');
          return `
            SELECT concepts.id, ${values}
            FROM (SELECT id FROM concepts WHERE old_id = '${concept}') concepts
          `;
        }).join(' UNION ')}
    `,
    resolve
  )));
};

const dropImportRows = (pgClient) => new Promise(resolve => pgClient.query(
  `ALTER TABLE concepts DROP COLUMN old_id`,
  resolve
));

export default {

  up(next) {
    pg.connect(pgURL, (error, pgClient) => {
      createSchema(pgClient)
        .then(() => importConcepts(pgClient))
        .then(() => importRequirements(pgClient))
        .then(() => importContainers(pgClient))
        .then(() => importExplanations(pgClient))
        .then(() => dropImportRows(pgClient))
        .then(next);
    });

  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};

