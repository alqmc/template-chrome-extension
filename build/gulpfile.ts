import { series } from 'gulp';
import { run, withTask } from './process';
import { createZip } from './buildZip';
import { copyFiles } from './copyfile';
import { buildBundles } from './build';
import { buildStyles } from './buildStyle';
import { parallel } from 'gulp';
export default series(
  // withTask('update:version', () => run('pnpm run update:version')),
  withTask('clear', () => run('pnpm run clear')),
  buildBundles,
  parallel(buildStyles, copyFiles),
  createZip
);
