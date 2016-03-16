import knex from 'knex';
import {config} from '../configs/config.custom';


export default knex({
  client: 'pg',
  connection: config.pgURL
})
