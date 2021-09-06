import del from 'del';
import { terser } from 'rollup-plugin-terser';
import cssStr from './lib/css-str';
import iifeStr from './lib/iife-str';

export default async function () {
  await del('./dist');

  return [true, false].map((minify) => ({
    input: './src/index.js',
    output: {
      file: `./dist/index${minify ? '-min' : ''}.js`,
      format: 'iife',
    },
    plugins: [
      minify && terser(),
      cssStr({ minify }),
      iifeStr({ minify }),
    ].filter((v) => v),
  }));
}
