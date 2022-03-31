import { series } from 'gulp';
import { run, withTask } from './process';
import { createZip } from './buildZip';
import { copyFiles } from './copyfile';
import { buildBundles } from './build';
export default series(
  // withTask('update:version', () => run('pnpm run update:version')),
  withTask('clear', () => run('pnpm run clear')),
  buildBundles,
  createZip,
  copyFiles
);
