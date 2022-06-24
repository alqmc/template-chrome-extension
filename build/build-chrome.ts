import { resolve } from 'path';
import { buildVueLib } from '@alqmc/build-vue';
import { buildTypescriptLib } from '@alqmc/build-ts';
import css from 'rollup-plugin-css-only';
import replace from '@rollup/plugin-replace';
import { buildOutpath, enterPath, rootpath } from './utils/path';
import { html } from './plugin/rollup-plugin-html';
import type { DefineTsConfig } from '@alqmc/build-ts';
import type { DefineVueConfig } from '@alqmc/build-vue';

const buildVueConfig: DefineVueConfig = {
  baseOptions: {
    input: resolve(enterPath, 'views/popup/index.ts'),
    outPutPath: resolve(buildOutpath, 'popup'),
    pkgPath: resolve(rootpath, 'package.json'),
    enterPath: resolve(enterPath, 'popup'),
    tsConfigPath: resolve(rootpath, 'tsconfig.json'),
    preserveModules: false,
    extraOptions: {
      // 会重写输出配置
      dir: undefined,
      format: 'iife',
      file: '../dist/popup/popup.js',
    },
  },
  pluginOptions: {
    mergeType: 'prefix',
    plugins: [
      css({ output: 'bundle.css' }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.BASE_URL': JSON.stringify('/'),
      }),
      html({
        template: resolve(enterPath, 'source/html/popup.html'),
        style: ['../style/popup.css'],
      }) as any,
    ],
  },
  includePackages: ['vue', 'vue-router'],
  buildProduct: ['es'],
  pureOutput: true,
};

const buildTsConfig: DefineTsConfig = {
  baseOptions: {
    input: resolve(enterPath, 'script/background.ts'),
    outPutPath: buildOutpath,
    pkgPath: resolve(rootpath, 'package.json'),
    enterPath: resolve(enterPath, 'popup'),
    tsConfigPath: resolve(rootpath, 'tsconfig.json'),
    preserveModules: false,
  },
  buildProduct: ['lib'],
  pureOutput: true,
};

export const buildVue = async () => {
  await buildVueLib(buildVueConfig);
};
export const buildTs = async () => {
  await buildTypescriptLib(buildTsConfig);
};
