`
  MATCH (c:Concept {id})
  MATCH (c)-[:REQUIRES|CONTAINED_BY*]->(reqs)
  WITH COLLECT(reqs.id) AS reqs
  RETURN reqs
`
