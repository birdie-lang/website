import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readExampleCatalog } from './example-catalog';
import { problems } from '../src/data/examples';

function metadata(id: number, position: number, featured = false) {
  return {
    title: `Problem ${id}`,
    difficulty: 'Easy',
    leetcode: { id, url: `https://leetcode.com/problems/problem-${id}/description/` },
    neetcode150: { position, category: 'Trees' },
    blind75: false,
    ...(featured ? {
      featuredOrder: position,
      concept: 'Visit a tree.',
      description: 'Visit each node.',
      note: 'No imports are needed.',
      notes: [],
    } : {}),
  };
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'birdie-examples-'));
  await writeFile(join(root, 'catalog.json'), JSON.stringify({
    neetcode150: {
      url: 'https://neetcode.io/practice/practice/neetcode150',
      orderSource: 'https://github.com/neetcode-gh/leetcode/blob/main/.problemSiteData.json',
    },
  }));
  return root;
}

async function writeExample(root: string, slug: string, data: ReturnType<typeof metadata>, translated = true) {
  const directory = join(root, slug);
  await mkdir(directory);
  await Promise.all([
    writeFile(join(directory, 'problem.json'), JSON.stringify(data)),
    ...(translated ? [
      writeFile(join(directory, 'solution.bd'), 'fn solve(value: int) int:\n    return value\n'),
      writeFile(join(directory, 'solution.py'), 'def solve(value: int) -> int:\n    return value\n'),
    ] : []),
  ]);
  return directory;
}

test('discovers new problems, preserves sources, and drops removed problems without registration', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeExample(root, 'second-problem', metadata(2, 2));
  const directory = await writeExample(root, 'first-problem', metadata(1, 1));
  const types = 'type TreeNode:\n    val: int';
  await writeFile(join(directory, 'provided-types.bd'), `${types}\n`);

  const snapshot = await readExampleCatalog(root);
  assert.deepEqual(snapshot.examples.map((example) => example.slug), ['first-problem', 'second-problem']);
  assert.equal(snapshot.examples[0]?.providedTypes, types);
  assert.equal(snapshot.examples[1]?.providedTypes, undefined);
  const first = snapshot.examples[0];
  assert(first && 'birdie' in first);
  assert.equal(first.birdie, 'fn solve(value: int) int:\n    return value');
  assert.deepEqual(await readExampleCatalog(root), snapshot);

  await rm(directory, { recursive: true });
  const updated = await readExampleCatalog(root);
  assert.deepEqual(updated.examples.map((example) => example.slug), ['second-problem']);
});

test('accepts metadata-only pending problems and a later translation without editorial copy', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = await writeExample(root, 'pending-problem', metadata(1, 1), false);
  const pending = (await readExampleCatalog(root)).examples[0];
  assert(pending);
  assert.equal('birdie' in pending, false);
  assert.equal('python' in pending, false);
  assert.equal(pending.description, undefined);

  await Promise.all([
    writeFile(join(directory, 'solution.bd'), 'fn solve() int:\n    return 1\n'),
    writeFile(join(directory, 'solution.py'), 'def solve():\n    return 1\n'),
  ]);
  const translated = (await readExampleCatalog(root)).examples[0];
  assert(translated && 'birdie' in translated);
  assert.equal(translated.python, 'def solve():\n    return 1');
});

test('preserves exact test case values and comparison rules in the snapshot', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = await writeExample(root, 'tree-problem', metadata(1, 1));
  await writeFile(join(directory, 'tests.json'), `{
    "entry": "solve",
    "check": "unordered",
    "argAdapters": ["tree"],
    "cases": [
      { "name": "large-values", "args": [[9007199254740993, null, -10000000000000000000000000000000000000001]], "expected": [9007199254740993] },
      { "name": "missing-tree", "args": [null], "expected": null }
    ]
  }`);

  const example = (await readExampleCatalog(root)).examples[0];
  assert(example && 'birdie' in example);
  assert.deepEqual(example.fixture, {
    entry: 'solve',
    check: 'unordered',
    argAdapters: ['tree'],
    cases: [
      { name: 'large-values', args: ['[9007199254740993,null,-10000000000000000000000000000000000000001]'], expected: '[9007199254740993]' },
      { name: 'missing-tree', args: ['null'], expected: 'null' },
    ],
  });
});

for (const missing of ['solution.bd', 'solution.py']) {
  test(`rejects a missing paired ${missing} with the problem name in the error`, async (t) => {
    const root = await fixture();
    t.after(() => rm(root, { recursive: true, force: true }));
    const directory = await writeExample(root, 'incomplete-problem', metadata(1, 1));
    await rm(join(directory, missing));
    await assert.rejects(readExampleCatalog(root), /Invalid example incomplete-problem:.*must either both exist or both be absent/);
  });
}

test('rejects unknown NeetCode categories', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const invalid = metadata(1, 1);
  invalid.neetcode150.category = 'Tree';
  await writeExample(root, 'bad-category', invalid, false);
  await assert.rejects(readExampleCatalog(root), /category/);
});

test('rejects pending homepage features and missing featured copy', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = await writeExample(root, 'featured-problem', metadata(1, 1, true), false);
  await assert.rejects(readExampleCatalog(root), /A featured problem must have both solutions/);

  await Promise.all([
    writeFile(join(directory, 'solution.bd'), 'fn solve() int:\n    return 1\n'),
    writeFile(join(directory, 'solution.py'), 'def solve():\n    return 1\n'),
  ]);
  const invalid = metadata(1, 1, true);
  delete invalid.note;
  await writeFile(join(directory, 'problem.json'), JSON.stringify(invalid));
  await assert.rejects(readExampleCatalog(root), /A featured problem requires note/);
});

test('rejects malformed problem metadata and blank source files', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const invalid = metadata(1, 1);
  invalid.leetcode.url = 'https://example.com/problem';
  const directory = await writeExample(root, 'bad-problem', invalid);
  await assert.rejects(readExampleCatalog(root), /Invalid example bad-problem:/);

  await writeFile(join(directory, 'problem.json'), JSON.stringify(metadata(1, 1)));
  await writeFile(join(directory, 'solution.bd'), ' \n');
  await assert.rejects(readExampleCatalog(root), /birdie/);
});

test('rejects directory names that cannot be stable URL slugs', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeExample(root, 'Bad Slug', metadata(1, 1));
  await assert.rejects(readExampleCatalog(root), /slug/);
});

for (const field of ['leetcode.id', 'neetcode150.position', 'featuredOrder'] as const) {
  test(`rejects duplicate ${field}`, async (t) => {
    const root = await fixture();
    t.after(() => rm(root, { recursive: true, force: true }));
    await writeExample(root, 'first-problem', metadata(1, 1, true));
    const duplicate = metadata(2, 2, true);
    if (field === 'leetcode.id') duplicate.leetcode.id = 1;
    if (field === 'neetcode150.position') duplicate.neetcode150.position = 1;
    if (field === 'featuredOrder') duplicate.featuredOrder = 1;
    await writeExample(root, 'second-problem', duplicate);
    await assert.rejects(readExampleCatalog(root), (error: unknown) => error instanceof Error && error.message.includes(`Duplicate ${field}`));
  });
}

test('the imported catalog covers the complete NeetCode 150 and Blind 75 lists', () => {
  const neetcode150 = problems.filter((problem) => problem.neetcode150 !== undefined);
  assert.equal(neetcode150.length, 150);
  assert.equal(neetcode150.filter((problem) => problem.blind75).length, 75);
  assert.deepEqual(neetcode150.map((problem) => problem.neetcode150?.position), Array.from({ length: 150 }, (_, index) => index + 1));
});
