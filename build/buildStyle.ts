import path from 'path';
import { dest, src } from 'gulp';
import cleanCss from 'gulp-clean-css';
import chalk from 'chalk';
import gulpLess from 'gulp-less';
import autoprefixer from 'gulp-autoprefixer';
import { buildOutpath, enterPath } from './utils/path';
export const buildStyles = () => {
  return src([path.resolve(enterPath, 'source/style/*.less')])
    .pipe(gulpLess())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(
      cleanCss({}, (d) => {
        console.log(
          `${chalk.cyan(d.name)}: ${chalk.yellow(
            d.stats.originalSize / 1000
          )} KB -> ${chalk.green(d.stats.minifiedSize / 1000)} KB`
        );
      })
    )
    .pipe(dest(`${buildOutpath}/style`));
};
