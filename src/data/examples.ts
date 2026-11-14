import snapshot from './examples.generated.json';
import { exampleSnapshotSchema } from '../lib/example-schema';

const validated = exampleSnapshotSchema.parse(snapshot);

export const catalog = validated.catalog;

export const problems = validated.examples
  .map((problem) => ({
    ...problem,
    href: 'birdie' in problem ? `/docs/examples/${problem.slug}/` : problem.leetcode.url,
  }))
  .sort((a, b) => (a.neetcode150?.position ?? Infinity) - (b.neetcode150?.position ?? Infinity) || a.title.localeCompare(b.title));

export const examples = problems
  .filter((problem) => 'birdie' in problem)
  .map((problem) => ({
    ...problem,
    id: problem.slug,
    filename: `${problem.slug}.bd`,
    source: problem.birdie,
  }));

export const featuredExamples = examples
  .filter((example) => example.featuredOrder !== undefined)
  .sort((a, b) => (a.featuredOrder ?? Infinity) - (b.featuredOrder ?? Infinity));

export type Example = (typeof examples)[number];
