import {db} from '../db/connection';
let fs = require('fs');

db.cypher(
  [
    `
      MATCH (c:Concept)
      OPTIONAL MATCH (c)-[:CONTAINED_BY]->(container:Concept)
      RETURN DISTINCT {id: c.id, name: c.name} AS concept,
        container.id AS container
    `,
    `
      MATCH (c1:Concept)-[:REQUIRES]->(c2:Concept)
      OPTIONAL MATCH (children1:Concept)-[:CONTAINED_BY]->(c1)
      OPTIONAL MATCH (children2:Concept)-[:CONTAINED_BY]->(c2)
      WITH c1, c2, COUNT(children1) AS count1, COUNT(children2) AS count2
      WHERE count1 = 0 AND count2 = 0
      RETURN DISTINCT c1.id AS c1, c2.id AS c2
    `
  ],
  (err, [concepts, reqs]) => {
    if (err) return console.error(err);

    let conceptsMap = new Map();
    for (let {container, concept} of concepts) {
      if (conceptsMap.has(container)) conceptsMap.get(container).push(concept);
      else conceptsMap.set(container, [concept]);
    }


    let buildSubgraphStr = (concepts, level = 0) => {
      let str = '';
      for (let concept of concepts) {
        let {id, name} = concept;
        let label = `label="${name}"`;
        let tabs = '\t'.repeat(level + 1);
        str += '\n' + tabs;

        let children = conceptsMap.get(id);
        let hasChildren = Boolean(children);

        if (hasChildren) {
          str += `subgraph "cluster${id}" {
${tabs}\t${label};
${tabs}${buildSubgraphStr(children, level + 1)}
${tabs}}
`;
        } else str += `"${id}" [${label}];`;
      }
      return str;
    };

    let edgesStr = '';
    for (let {c1, c2} of reqs) {
      edgesStr += `${'\t'}"${c1}" -> "${c2}";${'\n'}`;
    }

    let dotText = `digraph G {
  compound=true;
  edge[color="#00ff005f"];
  node[fillcolor="white"];
  bgcolor="#1f1f1f";
  ${buildSubgraphStr(conceptsMap.get(null))}

${edgesStr}
}
`;
    fs.writeFile('furfm.dot', dotText, (err) => {
      if (err) console.error(err);
      else console.log('Done!');
    });
  }
);
