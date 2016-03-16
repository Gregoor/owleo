
/*!
 * migrate
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

import Migration from './migration';
import {Set} from './set';

export default function migrate(title, up, down) {
  if ('string' == typeof title && up && down) {
    migrate.set.migrations.push(new Migration(title, up, down));
  } else if ('string' == typeof title) {
    migrate.set = new Set(title);
  } else if (!migrate.set) {
    throw new Error('must invoke migrate(path) before running migrations');
  } else {
    return migrate.set;
  }
};
