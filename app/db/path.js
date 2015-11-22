`
  MATCH (c:Concept {id})-[:REQUIRES|CONTAINED_BY*]->(reqs)
  WITH COLLECT(reqs.id) AS reqs
  RETURN reqs
`
