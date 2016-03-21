import knex from '../knex';

const ddl = `CREATE TABLE concepts
(
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    summary TEXT NOT NULL,
    summary_source TEXT,
    container_id INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    concepts_count INTEGER DEFAULT 0 NOT NULL
);
CREATE TABLE explanation_down_votes
(
    id INTEGER PRIMARY KEY NOT NULL,
    explanation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
CREATE TABLE explanation_up_votes
(
    id INTEGER PRIMARY KEY NOT NULL,
    explanation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
CREATE TABLE explanations
(
    id INTEGER PRIMARY KEY NOT NULL,
    concept_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_link BOOLEAN NOT NULL,
    is_paywalled BOOLEAN DEFAULT false NOT NULL,
    votes INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
CREATE TABLE mastered_concepts
(
    id INTEGER PRIMARY KEY NOT NULL,
    concept_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
CREATE TABLE requirements
(
    id INTEGER PRIMARY KEY NOT NULL,
    concept_id INTEGER NOT NULL,
    requirement_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
CREATE TABLE users
(
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT,
    password_hash TEXT,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    is_guest BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE concepts ADD FOREIGN KEY (container_id) REFERENCES concepts (id);
ALTER TABLE explanation_down_votes ADD FOREIGN KEY (explanation_id) REFERENCES explanations (id);
ALTER TABLE explanation_down_votes ADD FOREIGN KEY (user_id) REFERENCES users (id);
CREATE UNIQUE INDEX explanation_down_votes_explanation_id_user_id_key ON explanation_down_votes (explanation_id, user_id);
ALTER TABLE explanation_up_votes ADD FOREIGN KEY (explanation_id) REFERENCES explanations (id);
ALTER TABLE explanation_up_votes ADD FOREIGN KEY (user_id) REFERENCES users (id);
CREATE UNIQUE INDEX explanation_up_votes_explanation_id_user_id_key ON explanation_up_votes (explanation_id, user_id);
ALTER TABLE explanations ADD FOREIGN KEY (concept_id) REFERENCES concepts (id);
ALTER TABLE explanations ADD FOREIGN KEY (author_id) REFERENCES users (id);
ALTER TABLE mastered_concepts ADD FOREIGN KEY (concept_id) REFERENCES concepts (id);
ALTER TABLE mastered_concepts ADD FOREIGN KEY (user_id) REFERENCES users (id);
CREATE UNIQUE INDEX mastered_concepts_concept_id_user_id_key ON mastered_concepts (concept_id, user_id);
ALTER TABLE requirements ADD FOREIGN KEY (concept_id) REFERENCES concepts (id);
ALTER TABLE requirements ADD FOREIGN KEY (requirement_id) REFERENCES concepts (id);
CREATE UNIQUE INDEX requirements_concept_id_requirement_id_key ON requirements (concept_id, requirement_id);
`;

const checkQuery = `SELECT exists(SELECT * FROM information_schema.tables
WHERE table_catalog = current_database() AND table_name = 'concepts')`;

export default {

  up(next) {
    knex.raw(checkQuery).then(({rows: [{exists}]}) => exists ?
      console.log('Schema already exists, skipping') :
      knex.raw(ddl)
    ).then(() => next());
  },

  down(next) {
    next();
  }

}
