import { rollup } from 'rollup';
import { terser } from 'rollup-plugin-terser';

const prefix = 'iife-str:';

export default function ({ minify } = {}) {
  return {
    name: 'iife-str',
    async resolveId(id, importer) {
      if (!id.startsWith(prefix)) return;
      const resolved = await this.resolve(id.slice(prefix.length), importer);
      if (!resolved) throw Error(`Couldn't resolve ${id} from ${importer}`);
      return prefix + resolved.id;
    },
    async load(id) {
      if (!id.startsWith(prefix)) return;
      const path = id.slice(prefix.length);
      const build = await rollup({
        input: path,
        plugins: minify ? [terser()] : [],
      });

      const { output } = await build.generate({ format: 'iife' });
      const chunk = output[0];

      return `export default ${JSON.stringify(chunk.code)}`;
    },
  };
}
