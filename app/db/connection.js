import neo4j from 'neo4j';
import config from '../configs/config.custom';

let connection = {
  'db': new neo4j.GraphDatabase({
    'url': config.dbHost || 'http://localhost:7474'
  }),
  'query': (query, params) => new Promise((resolve) => {
    let {stack} = new Error();
    connection.db.cypher({query, params, 'lean': true}, (err, data) => {
      if (err) process.stderr.write(err + '\n' + stack);
      else resolve(data);
    });
  })
};

export default connection;
