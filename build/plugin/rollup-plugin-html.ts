import type { NormalizedOutputOptions, Plugin, PluginContext } from 'rollup';
import { parse } from 'node-html-parser';
import { basename } from 'path';
import { readFile } from 'fs/promises';
import { formatCode } from '../utils/bufity';
interface htmlOptions {
  template: string;
  style?: string[];
}
// 将输出chunk插入html
export const html = (htmlOptions: htmlOptions): Plugin => {
  const pluginName = 'html';
  async function buildStart(this: PluginContext) {
    const template = await readFile(htmlOptions.template, 'utf-8');
    this.cache.set('templateIsFile', template);
  }
  function generateBundle(
    this: PluginContext,
    options: NormalizedOutputOptions
  ) {
    const template = this.cache.get('templateIsFile');
    const doc = parse(template, {
      comment: true
    });
    const html = doc.querySelector('html');
    const head = html.querySelector('head');
    const script = `<script defer src="./${basename(options.file)}"></script>`;
    htmlOptions.style?.forEach((style) => {
      const str = `<link rel="stylesheet" href="${style}">`;
      head.appendChild(parse(str));
    });
    head.appendChild(parse(script));
    this.emitFile({
      type: 'asset',
      fileName: basename(options.file).replace('.js', '.html'),
      name: basename(options.file).replace('.js', ''),
      source: formatCode(doc.toString(), 'html')
    });
  }
  return {
    name: pluginName,
    buildStart,
    generateBundle
  };
};
