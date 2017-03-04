import knex from 'knex';
import config from '../configs/config';


export default knex({
  client: 'pg',
  connection: config.pgURL
})
