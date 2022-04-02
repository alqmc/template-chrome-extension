import { rollup } from 'rollup';
import type { Plugin } from 'rollup';
import vue from '@vitejs/plugin-vue';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import path from 'path';
import { enterPath } from './utils/path';
import replace from '@rollup/plugin-replace';
import css from 'rollup-plugin-css-only';
import { html } from './plugin/rollup-plugin-html';
const buildVueBunless = () => {
  const plugins = [
    css({ output: 'bundle.css' }),
    vue({
      isProduction: true
    }),
    nodeResolve({
      extensions: ['.mjs', '.js', '.json', '.ts']
    }),
    commonjs(),
    esbuild({
      tsconfig: path.resolve(__dirname, '../tsconfig.json'),
      minify: false,
      loaders: {
        '.vue': 'ts'
      }
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.BASE_URL': JSON.stringify('/')
    }),
    html({
      template: path.resolve(enterPath, 'source/html/popup.html')
    })
  ] as Plugin[];
  return plugins;
};
const buildTsBunless = () => {
  const plugins = [
    nodeResolve({ extensions: ['ts', 'js', 'json', '.vue'] }),
    commonjs(),
    esbuild({
      sourceMap: false,
      minify: false,
      tsconfig: path.resolve(__dirname, '../tsconfig.json')
    })
  ];
  return plugins;
};
const getBundle = async (input: string, isVUe: boolean = false) => {
  return rollup({
    input: input,
    plugins: isVUe ? buildVueBunless() : buildTsBunless()
  });
};
const buildPopup = async () => {
  const popupEnter = path.resolve(enterPath, 'views/popup/index.ts');
  const popupBundles = await getBundle(popupEnter, true);
  await popupBundles.write({
    format: 'umd',
    file: '../dist/popup/popup.js'
  });
};
const buildBackGround = async () => {
  const bgEnter = path.resolve(enterPath, 'script/background.ts');
  const bgBundles = await getBundle(bgEnter);
  await bgBundles.write({
    format: 'umd',
    file: '../dist/background.js'
  });
};
export const buildBundles = () =>
  Promise.all([buildPopup(), buildBackGround()]);
