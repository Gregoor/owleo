import _ from 'lodash';

import {db, query} from '../connection';
import knex from '../knex';

const schemaQuery = `
  CREATE TABLE concepts (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    summary        TEXT NOT NULL,
    summary_source TEXT NULL,
    container_id   INT REFERENCES concepts ON DELETE SET NULL,
    created_at     TIMESTAMP DEFAULT now(),
    concepts_count  INT NOT NULL DEFAULT 0,
    old_id         TEXT NOT NULL UNIQUE,
    CHECK (id != container_id)
  );

  CREATE TABLE requirements (
    id             SERIAL PRIMARY KEY,
    concept_id     INT NOT NULL REFERENCES concepts ON DELETE CASCADE,
    requirement_id INT NOT NULL REFERENCES concepts ON DELETE CASCADE,
    created_at     TIMESTAMP DEFAULT now(),
    UNIQUE (concept_id, requirement_id),
    CHECK (concept_id != requirements.requirement_id)
  );

  CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          TEXT,
    password_hash TEXT,
    is_admin      BOOLEAN NOT NULL DEFAULT FALSE ,
    is_guest      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT now(),
    old_id        TEXT NOT NULL UNIQUE
  );
  
  CREATE TABLE explanations (
    id           SERIAL PRIMARY KEY,
    concept_id   INT     NOT NULL REFERENCES concepts,
    author_id    INT     NOT NULL REFERENCES users,
    content      TEXT    NOT NULL,
    is_link      BOOLEAN NOT NULL,
    is_paywalled BOOLEAN NOT NULL DEFAULT FALSE,
    votes        INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMP DEFAULT now(),
    old_id       TEXT NOT NULL UNIQUE
  );

  CREATE TABLE mastered_concepts (
    id          SERIAL PRIMARY KEY,
    concept_id  INT NOT NULL REFERENCES concepts,
    user_id     INT NOT NULL REFERENCES users,
    created_at     TIMESTAMP DEFAULT now(),
    UNIQUE (concept_id, user_id)
  );

  CREATE TABLE explanation_up_votes (
    id             SERIAL PRIMARY KEY,
    explanation_id INT NOT NULL REFERENCES explanations ON DELETE CASCADE,
    user_id        INT NOT NULL REFERENCES users        ON DELETE CASCADE,
    created_at     TIMESTAMP DEFAULT now(),
    UNIQUE (explanation_id, user_id)
  );

  CREATE TABLE explanation_down_votes (
    id             SERIAL PRIMARY KEY,
    explanation_id INT NOT NULL REFERENCES explanations ON DELETE CASCADE,
    user_id        INT NOT NULL REFERENCES users        ON DELETE CASCADE,
    created_at     TIMESTAMP DEFAULT now(),
    UNIQUE (explanation_id, user_id)
  );
`;

const buildConceptImports = () => query(
  'MATCH (concept:Concept) RETURN concept'
).then((concepts) => `
    INSERT INTO concepts (old_id, name, summary, summary_source)
    VALUES ${concepts.map(({concept: {id, name, summary, summarySource}}) => {
      return `(
        ${[id, name, summary || '', summarySource || '']
          .map(c => `'${c.split('\'').join('\'\'')}'`).join(', ')}
        )`;
    }).join(', ')}
  `
);

const buildRequirementsImport = () => query(`
  MATCH (concept:Concept)-[:REQUIRES]->(req:Concept)
  RETURN concept.id AS concept, req.id AS req
`).then(reqs => reqs.map(({concept, req}) => `
  INSERT INTO requirements (concept_id, requirement_id)
    SELECT
      (SELECT id FROM concepts WHERE old_id = '${concept}'),
      (SELECT id FROM concepts WHERE old_id = '${req}')
`).join(';'));

const buildContainersImport = () => query(`
  MATCH (concept:Concept)-[:CONTAINED_BY]->(container:Concept)
  RETURN concept.id AS concept, container.id AS container`
).then(containers => containers.map(({concept, container}) => `
  UPDATE concepts
    SET container_id = container.id
    FROM
      (SELECT id FROM concepts WHERE old_id = '${container}') AS container
    WHERE concepts.old_id = '${concept}'
`).join(';'));

const buildExplanationsImport = () => query(`
  MATCH (e:Explanation)-[:EXPLAINS]->(c:Concept)
  RETURN c.id AS concept, e AS explanation
`).then(explanations => `
  INSERT INTO explanations
    (concept_id, author_id, content, is_link, is_paywalled, old_id)
    ${explanations.map(({concept, explanation}) => {
      const {id, content, type, paywalled} = explanation;
      const values = [
        '\'' + content.split('\'').join('\'\'') + '\'',
        type == 'link',
        Boolean(paywalled),
        '\'' + id + '\''
      ].join(', ');
      return `
            SELECT concepts.id, users.id, ${values}
            FROM (SELECT id FROM concepts WHERE old_id = '${concept}') concepts,
              (SELECT id FROM users WHERE name = 'gregor') users
          `;
    }).join(' UNION ')}
  `
);

const buildUsersImport = () => query(`
  MATCH (user:User)
  OPTIONAL MATCH (user)-[:MASTERED]->(concept:Concept)
  RETURN user, COLLECT(concept) AS concepts
`).then((users) => users.map(({user, concepts}) =>
  knex('users').insert(Object.assign(
    _.pick(user, 'name', 'password_hash'),
    {is_admin: user.admin, is_guest: user.isGuest, old_id: user.id}
  )).toString() + ';' +
  concepts.map((concept) => `
    INSERT INTO mastered_concepts (concept_id, user_id)
    SELECT concepts.id, users.id
    FROM
      (SELECT * FROM concepts WHERE old_id = '${concept.id}') concepts,
      (SELECT * FROM users WHERE old_id = '${user.id}') users
  `).join(';') + ';'
).join(''));

const buildVotesImport = () => query(`
  MATCH (user:User)-[r:UPVOTED|:DOWNVOTED]->(explanation:Explanation)
  RETURN user, explanation, TYPE(r) = "UPVOTED" AS isUpvote
`).then((upvotes) => upvotes.map(({user, explanation, isUpvote}) => `
    ${knex('explanations').where({old_id: explanation.id})
      [isUpvote ? 'increment' : 'decrement']('votes')};
    INSERT INTO explanation_${isUpvote ? 'up' : 'down'}_votes
      (explanation_id, user_id)
      SELECT explanations.id, users.id
      FROM
        (SELECT * FROM explanations WHERE old_id = '${explanation.id}') explanations,
        (SELECT * FROM users WHERE old_id = '${user.id}') users;
  `).join(''));

const countContainedConcepts = `
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
    SELECT COUNT(*) - 1
    FROM containers
  )
`;

export default {

  up(next) {
    Promise.all([
      schemaQuery,
      buildConceptImports(),
      buildRequirementsImport(),
      buildContainersImport(),
      buildUsersImport(),
      buildExplanationsImport(),
      buildVotesImport(),
      countContainedConcepts,
      `
        ALTER TABLE concepts DROP COLUMN old_id;
        ALTER TABLE explanations DROP COLUMN old_id;
        ALTER TABLE users DROP COLUMN old_id
      `
    ]).then((statements) => knex.raw(statements.join(';\n')))
      .then(() => next())
      .catch((e) => console.error(e));
  },

  down(next) {
    console.error('this migration cannot be reversed');
    next();
  }

};
