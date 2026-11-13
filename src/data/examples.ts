import twoSum from './examples/two-sum.bd?raw';
import validParentheses from './examples/valid-parentheses.bd?raw';
import binarySearch from './examples/binary-search.bd?raw';
import groupAnagrams from './examples/group-anagrams.bd?raw';

export const examples = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    filename: 'two-sum.bd',
    concept: 'Find a pair with a map.',
    description: 'For each number, look up its complement among earlier numbers. Return their indices when a pair is found.',
    note: 'Parameter types are explicit. The map’s key and value types are inferred from how it is used.',
    source: twoSum.trimEnd(),
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    filename: 'valid-parentheses.bd',
    concept: 'Match brackets with a stack.',
    description: 'Push opening brackets. For each closing bracket, pop and check the matching opener.',
    note: 'The stack stores char values. Its element type is inferred from the values pushed onto it.',
    source: validParentheses.trimEnd(),
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    filename: 'binary-search.bd',
    concept: 'Halve the search interval.',
    description: 'Search a sorted list by comparing the target with the middle value, then continuing in one half.',
    note: '// rounds down; .size gives the number of elements.',
    source: binarySearch.trimEnd(),
  },
  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    filename: 'group-anagrams.bd',
    concept: 'Group by a sorted key.',
    description: 'Sort each word into a key. Words with the same key go into the same list.',
    note: 'map(list) creates a fresh list for each missing key. word.sorted() returns a new string.',
    source: groupAnagrams.trimEnd(),
  },
];
