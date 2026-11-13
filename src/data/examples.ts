import twoSum from './examples/two-sum.bd?raw';
import validParentheses from './examples/valid-parentheses.bd?raw';
import binarySearch from './examples/binary-search.bd?raw';
import groupAnagrams from './examples/group-anagrams.bd?raw';

export const examples = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    filename: 'two-sum.bd',
    concept: 'A map. A loop. A solution.',
    description: 'Keep track of the numbers you have seen. When the missing partner appears, return both indices.',
    note: 'Parameter types are explicit. The map’s key and value types are inferred from how it is used.',
    source: twoSum.trimEnd(),
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    filename: 'valid-parentheses.bd',
    concept: 'A stack that says what it does.',
    description: 'Push opening brackets, then pop and match each closing bracket. An empty stack means everything paired up.',
    note: 'Stacks are a dedicated collection. Their LIFO behavior is explicit, with push and pop operations.',
    source: validParentheses.trimEnd(),
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    filename: 'binary-search.bd',
    concept: 'Keep the algorithm in view.',
    description: 'Start with a sorted list. Compare the middle value, then keep searching the half that can contain the target.',
    note: 'Indentation defines blocks. Integer floor division makes the midpoint calculation explicit.',
    source: binarySearch.trimEnd(),
  },
  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    filename: 'group-anagrams.bd',
    concept: 'Group words by their letters.',
    description: 'Sort each word into a key, then collect matching words in a map.',
    note: 'map(list) creates a new list for each missing key. sorted() returns a new string.',
    source: groupAnagrams.trimEnd(),
  },
];
