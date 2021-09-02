import postcss from 'postcss';
import cssnano from 'cssnano';
import { promises as fsp } from 'fs';

const prefix = 'css-str:';

export default function () {
  return {
    name: 'css-str',
    async resolveId(id, importer) {
      if (!id.startsWith(prefix)) return;
      const resolved = await this.resolve(id.slice(prefix.length), importer);
      if (!resolved) throw Error(`Couldn't resolve ${id} from ${importer}`);
      return prefix + resolved.id;
    },
    async load(id) {
      if (!id.startsWith(prefix)) return;
      const path = id.slice(prefix.length);
      const file = await fsp.readFile(path);

      const cssResult = await postcss([cssnano()]).process(file, {
        from: path,
      });

      return `export default ${JSON.stringify(cssResult.css)}`;
    },
  };
}
