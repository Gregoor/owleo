import neo4j from 'neo4j';
import {config} from '../configs/config.custom';

const db = new neo4j.GraphDatabase({
    'url': config.dbHost || 'http://localhost:7474'
});

const query = (query, params) => new Promise((resolve) => {
  let {stack} = new Error();
  db.cypher({query, params, 'lean': true}, (err, data) => {
    if (err) process.stderr.write(err + '\n' + stack);
    else resolve(data);
  });
});

export {db, query};
