import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readExampleCatalog } from './example-catalog';

const args = process.argv.slice(2);
const check = args.includes('--check');
const positional = args.filter((arg) => arg !== '--check');
if (positional.length > 1 || positional.some((arg) => arg.startsWith('-'))) {
  throw new Error('Usage: bun run sync:examples [--check] [path/to/birdie/examples/leetcode]');
}

const sourceDirectory = positional[0]
  ? resolve(positional[0])
  : fileURLToPath(new URL('../../birdie/examples/leetcode/', import.meta.url));
const output = new URL('../src/data/examples.generated.json', import.meta.url);
const snapshot = await readExampleCatalog(sourceDirectory);
const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;

if (check) {
  let current: string;
  try {
    current = await readFile(output, 'utf8');
  } catch (error: unknown) {
    throw new Error('Cannot read the example snapshot. Run bun run sync:examples.', { cause: error });
  }
  if (current !== serialized) throw new Error('The example snapshot is stale. Run bun run sync:examples.');
  console.log(`Example snapshot matches all ${snapshot.examples.length} canonical problems.`);
} else {
  await writeFile(output, serialized);
  console.log(`Synced ${snapshot.examples.length} examples from ${sourceDirectory}.`);
}
