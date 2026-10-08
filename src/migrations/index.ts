import * as migration_20261007_104758_initial from './20261007_104758_initial';
import * as migration_20261008_072658_travelers from './20261008_072658_travelers';

export const migrations = [
  {
    up: migration_20261007_104758_initial.up,
    down: migration_20261007_104758_initial.down,
    name: '20261007_104758_initial',
  },
  {
    up: migration_20261008_072658_travelers.up,
    down: migration_20261008_072658_travelers.down,
    name: '20261008_072658_travelers'
  },
];
