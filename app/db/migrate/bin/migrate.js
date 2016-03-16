import fs from 'fs';
import {join} from 'path';
import {migrate} from '../';

const args = process.argv.slice(2);
const options = {args: []};

let cwd;

const usage =
`  Usage: migrate [options] [command]

  Options:
     -c, --chdir <path>   change the working directory
     --state-file <path>  set path to state file (migrations/.migrate)

  Commands:
     down   [name]    migrate down till given migration
     up     [name]    migrate up till given migration (the default command)
     create [title]   create a new migration file with optional [title]`;


const template =
`export default {

  up(next) {
    next();
  },

  down(next) {
    next();
  }

}`;

const abort = (msg) => {
  console.error('  %s', msg);
  process.exit(1);
};

const required = () => {
  if (args.length) return args.shift();
  abort(arg + ' requires an argument');
};


const log = (key, msg) => console.log(key, msg);

const loadMigrations = () => fs.readdirSync('migrations')
  .filter((file) => file.match(/^\d+.*\.js$/))
  .sort()
  .map((file) => join('migrations', file));


const commands = {

  up(migrationName) {
    performMigration('up', migrationName);
  },

  down(migrationName){
    performMigration('down', migrationName);
  },

  create(){
    const curr = Date.now();
    let title = [].slice.call(arguments).join(' ').replace(/\s+/g, '-');
    title = title ? curr + '-' + title : curr;
    create(title);
  }

};

const create = (name) => {
  var path = join('migrations', name + '.js');
  log('create', join(process.cwd(), path));
  fs.writeFileSync(path, template);
};

const performMigration = (direction, migrationName) => {
  migrate(options.stateFile || join('migrations', '.migrate'));
  for (const path of loadMigrations()) {
    const mod = require(process.cwd() + '/' + path).default;
    migrate(path, mod.up, mod.down);
  }

  const set = migrate();

  set.on('migration', (migration, direction) => log(direction, migration.title));

  set.on('save', () => {
    log('migration', 'complete');
    process.exit();
  });

  set.on('error', (err) => {
    log('error', err);
    process.exit(1);
  });

  const migrationPath = migrationName
    ? join('migrations', migrationName)
    : migrationName;

  set[direction](migrationPath);
};


/*
 Execution
 */

try {
  fs.mkdirSync('migrations', 0o774);
} catch (err) {
  // ignore
}

let arg;
while (args.length) {
  arg = args.shift();
  switch (arg) {
    case '-h':
    case '--help':
    case 'help':
      console.log(usage);
      process.exit();
      break;
    case '-c':
    case '--chdir':
      process.chdir(cwd = required());
      break;
    case '--state-file':
      options.stateFile = required();
      break;
    default:
      if (options.command) {
        options.args.push(arg);
      } else {
        options.command = arg;
      }
  }
}

var command = options.command || 'up';
if (!(command in commands)) abort('unknown command "' + command + '"');
command = commands[command];
command.apply(this, options.args);
