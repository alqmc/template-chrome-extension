import { rollup } from 'rollup';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import path from 'path';
import typescript from '@rollup/plugin-typescript';
import replace from 'rollup-plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import { enterPath } from './utils/path';
import { dependencies } from '../package.json';
const external = Object.keys(dependencies || '');
const globals = external.reduce((prev, current) => {
  const newPrev = prev;
  newPrev[current] = current;
  return newPrev;
}, {});

const getBundle = async (input: string, isVUe: boolean = false) => {
  return rollup({
    input: input,
    plugins: [
      // 简易引用处理
      nodeResolve({
        extensions: ['.js', '.ts']
      }),
      commonjs(),
      typescript({
        tsconfig: path.resolve(__dirname, '../tsconfig.json')
      }),
      isVUe &&
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
          'process.env.VUE_ENV': JSON.stringify('browser')
        }),
      isVUe &&
        vue({
          isProduction: false
        }),
      isVUe && vueJsx(),
      isVUe &&
        esbuild({
          loaders: {
            '.vue': 'ts'
          }
        })
    ],
    treeshake: false
  });
};
const buildPopup = async () => {
  const popupEnter = path.resolve(enterPath, 'views/popup/index.ts');
  const popupBundles = await getBundle(popupEnter, true);
  await popupBundles.write({
    format: 'esm',
    file: '../dist/popup/popup.js'
  });
};
const buildBackGround = async () => {
  const bgEnter = path.resolve(enterPath, 'script/background.ts');
  const bgBundles = await getBundle(bgEnter);
  await bgBundles.write({
    format: 'esm',
    file: '../dist/background.js'
  });
};
export const buildBundles = () =>
  Promise.all([buildPopup(), buildBackGround()]);
