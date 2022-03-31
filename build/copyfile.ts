import { resolve, join, basename } from 'path';
import { copyFile, access, mkdir } from 'fs/promises';
import { buildOutpath, rootpath, enterPath } from './utils/path';
import glob from 'fast-glob';
const moveDir = async (source: string, target: string) => {
  await access(target).catch(() => mkdir(target));
  const file = glob.sync(`*`, {
    cwd: source,
    absolute: true,
    onlyFiles: false,
    deep: 3
  });
  file.forEach(async (x) => {
    await copyFile(x, join(target, basename(x)));
  });
};

export const copyFiles = () =>
  Promise.all([
    copyFile(
      resolve(enterPath, 'manifest.json'),
      resolve(buildOutpath, 'manifest.json')
    ),
    copyFile(
      resolve(rootpath, 'package.json'),
      resolve(buildOutpath, 'package.json')
    ),
    copyFile(
      resolve(rootpath, 'README.md'),
      resolve(buildOutpath, 'README.md')
    ),
    moveDir(resolve(enterPath, 'assets'), resolve(buildOutpath, 'assets')),
    moveDir(resolve(enterPath, 'source/style'), resolve(buildOutpath, 'style')),
    moveDir(resolve(enterPath, 'source/html'), resolve(buildOutpath, 'html'))
  ]);
