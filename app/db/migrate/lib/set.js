
/*!
 * migrate - Set
 * Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

import fs  from 'fs';
import {EventEmitter} from 'events';


const positionOfMigration = (migrations, filename) => {
  for(let i = 0; i < migrations.length; ++i) {
    if (migrations[i].title == filename) return i;
  }
  return -1;
};

class Set extends EventEmitter {

  migrations = [];
  pos = 0;

  /**
   * Initialize a new migration `Set` with the given `path`
   * which is used to store data between migrations.
   *
   * @param {String} path
   * @api private
   */
  constructor(path) {
    super();
    this.path = path;
  }

  save() {
    fs.writeFile(this.path, JSON.stringify(this), (err) =>{
      if (err) {
        this.emit('error', err);
        return;
      }

      this.emit('save');
    });
  }

  /**
   * Load the migration data and call `fn(err, obj)`.
   *
   * @param {Function} fn
   * @api public
   */
  load(fn) {
    this.emit('load');
    fs.readFile(this.path, 'utf8', (err, json) => {
      if (err) return fn(err);
      try {
        fn(null, JSON.parse(json));
      } catch (err) {
        fn(err);
      }
    });
  }

  migrate(direction, migrationName) {
    this.load((err, obj) => {
      if (err) {
        if ('ENOENT' != err.code) return this.emit('error', err);
      } else {
        this.pos = obj.pos;
      }
      this._doMigrate(direction, migrationName);
    });
  }

  up(migrationName) {
    this.migrate('up', migrationName);
  }

  down(migrationName) {
    this.migrate('down', migrationName);
  }

  _doMigrate(direction, migrationName) {
    const next = (err, migration) => {
      if (err) {
        this.emit('error', err);
        return;
      }

      if (!migration) {
        this.emit('complete');
        this.save();
        return;
      }

      this.emit('migration', migration, direction);
      migration[direction](function(err){
        next(err, migrations.shift());
      });
    };

    let migrations;
    let migrationPos;

    if (!migrationName) {
      migrationPos = direction == 'up' ? this.migrations.length : 0;
    } else if ((migrationPos = positionOfMigration(this.migrations, migrationName)) == -1) {
      console.error("Could not find migration: " + migrationName);
      process.exit(1);
    }


    switch (direction) {
      case 'up':
        migrations = this.migrations.slice(this.pos, migrationPos+1);
        this.pos += migrations.length;
        break;
      case 'down':
        migrations = this.migrations.slice(migrationPos, this.pos).reverse();
        this.pos -= migrations.length;
        break;
    }

    next(null, migrations.shift());
  }

}


export {Set};
