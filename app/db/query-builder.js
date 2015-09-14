import _ from 'lodash';

import {query} from './connection';

/**
 * How-TODO-Make this more awesome:
 * - consider order of statements
 * - allow OR in where
 */
class QueryBuilder {

  constructor() {
    this.matches = [];
    this.optionalMatches = [];
    this.conditions = [];
    this.lateConditions = [];
    this.selections = {};
    this.withClauses = [];
  }

  match(...clauses) {
    this.matches = this.matches.concat(clauses);
    return this;
  }

  optionalMatch(...clauses) {
    this.optionalMatches = this.optionalMatches.concat(clauses);
    return this;
  }

  where(...clauses) {
    this.conditions = this.conditions.concat(clauses);
    return this;
  }

  lateWhere(...clauses) {
    this.lateConditions = this.lateConditions.concat(clauses);
    return this;
  }

  with(...clauses) {
    this.withClauses = this.withClauses.concat(clauses);
    return this;
  }

  select(...selections) {
    _.merge(this.selections, ...selections);
    return this;
  }

  run(params) {
    let {matches, optionalMatches, conditions, lateConditions, selections, withClauses} = this;

    selections = _.transform(selections, (result, alias, selection) => {
      result.push(alias == null ? selection : `${selection} AS ${alias}`);
    }, []);

    let queryStr = `
      MATCH ${matches.join(',')}

      ${_.isEmpty(conditions) ? '' :
        'WHERE ' + conditions.join(' AND ')}

      ${optionalMatches.map(m => `OPTIONAL MATCH ${m}`).join('\n')}

      ${_.isEmpty(withClauses) ? '' :
        'WITH ' + withClauses.join(', ')}

      ${_.isEmpty(lateConditions) ? '' :
        'WHERE ' + lateConditions.join(' AND ')}

      RETURN ${selections.join(', ')}
    `;
    //console.log(queryStr, params);
    return query(queryStr, params);
  }

}

export default QueryBuilder;
