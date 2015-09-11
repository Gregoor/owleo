import babelRelayPlugin from 'babel-relay-plugin';
import schema from '../data/schema.json';

export default babelRelayPlugin(schema.data);
