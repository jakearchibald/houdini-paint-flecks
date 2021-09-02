import del from 'del';
import { terser } from 'rollup-plugin-terser';
import cssStr from './lib/css-str';
import iifeStr from './lib/iife-str';

export default async function () {
  await del('.tmp/build');

  return {
    input: './src/index.js',
    output: {
      file: './dist/index.js',
      format: 'iife',
    },
    plugins: [terser(), cssStr(), iifeStr()],
  };
}
