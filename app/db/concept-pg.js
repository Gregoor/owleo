import pgQuery from './pg-query';

const FIND_QUERY = `
WITH RECURSIVE nested_concepts AS (
    SELECT concepts.*, 0 AS level, ARRAY[]::INT[] AS containers
    FROM concepts
    WHERE id NOT IN (
      SELECT concepts.id
      FROM concepts
      JOIN requirements ON concepts.id = requirements.concept_id
      LEFT JOIN container_requirements
          ON requirements.id = container_requirements.requirement_id
    )
  UNION ALL
    SELECT concepts.*, nested_concepts.level + 1 AS level,
      array_append(nested_concepts.containers, required_concept_id) AS containers
    FROM nested_concepts, concepts
    JOIN requirements ON concepts.id = requirements.concept_id
    JOIN container_requirements
      ON requirements.id = container_requirements.requirement_id
    WHERE nested_concepts.id = requirements.required_concept_id
)
SELECT name, containers FROM nested_concepts;
`;

export default {
  find: (params = {}, fields = {}) => {
    return pgQuery(FIND_QUERY).then(({rows}) => {
      let conceptMap = new Map(rows.map((concept) => ([concept.id, concept])));

    });
  }
}
