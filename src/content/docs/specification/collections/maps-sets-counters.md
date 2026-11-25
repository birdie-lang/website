---
title: Maps, sets & counters
description: Keyed lookups, distinct values, frequency counts, and iteration order.
navTitle: Maps, sets & counters
section: specification
order: 6
---

## Maps

`map[K, V]` maps keys of type `K` to values of type `V`. Create an empty map with `map()` and infer its types from usage:

```birdie
seen = map()
seen[num] = i
```

A populated map can use a literal:

```birdie
matching = {')': '(', ']': '[', '}': '{'}
```

An ordinary `map()` has no default. A missing-key lookup raises a runtime error. Maps can also provide a default value or factory, described below.

### Operations

For `m: map[K, V]`, `key` must have type `K`; `value` and `fallback` must have type `V`.

| Operation | Returns | Mutates | Behavior |
| --- | --- | --- | --- |
| `m[key]` | `V` | On a miss with a default | Return the stored value, insert a default on a miss, or raise a runtime error if there is no default. |
| `m[key] = value` | No value | Yes | Insert or replace an entry. |
| `key in m` | `bool` | No | Check stored keys. |
| `m.get(key)` | `V?` | No | Return the stored value, or `none` without inserting. |
| `m.get(key, fallback)` | `V` | No | Return the stored value or the supplied fallback. |
| `m.remove(key)` | `bool` | On a hit | Remove a stored entry; return whether it existed. |
| `m.size` | `int` | No | Read the number of stored entries. |
| `m.values()` | `list[V]` | No | Allocate a snapshot of stored values in map iteration order. |

Only a missing-key lookup with `m[key]` obtains and inserts a configured default. Assignment, membership checks, either `get` form, `remove`, and `values` never call the default factory.

Stored values such as `0`, `false`, and empty collections are returned unchanged by either `get` form.

### Optional lookup and removal

`m.get(key)` distinguishes a missing key from a present nonoptional value using the existing optional type. A map with a configured default still returns `none` on a miss without creating an entry:

```birdie
child = node.chars.get(char)
if child == none:
    return false

removed = node.chars.remove(char)
```

- `get` takes one key, optionally followed by an explicit fallback. Keys must fit `K`; a supplied fallback must fit `V`. Evaluate the receiver, key, and any fallback expression once, in that order. The fallback is evaluated even when the key exists, following ordinary argument rules.
- Without a fallback, return `V?`. If `V` is already optional, the result remains that optional type rather than adding another wrapper. Use `key in m` when a missing entry must be distinguished from a stored `none`.
- With a fallback, preserve the existing `V` result type and leave the map unchanged on a miss. Neither form obtains a configured default or replaces stored values based on truthiness.
- An optional-returning helper can use `node = node.chars.get(char)?` to stop at a missing path. An enclosing function returning `bool` must handle absence explicitly to return `false`; propagation does not convert `none` into a boolean.
- `remove` takes exactly one key of type `K`. Evaluate the receiver and key once, in that order. Remove the entry and return `true` if it existed; otherwise return `false` without changing the map. A stored `none` still counts as an existing entry. Wrong arity or incompatible types are compile-time errors.
- Removal discards the map's entry, not other references to its previous value. It never reads or creates a default value. Map mutation during direct map iteration remains open; removing from a map while iterating an unrelated direction list does not encounter that issue.
- Both lookup and removal use the ordinary map key equality and hashing rules, with expected O(1) table work plus the key's hashing and equality costs.

See [Implement Trie](/examples/implement-trie-prefix-tree) for optional lookup and [Word Search II](/examples/word-search-ii) for pruning branches with `remove`.

### Default values and factories

Pass a non-callable immutable value to use it as the default, or a zero-argument callable to produce a value for each missing key. The argument’s type determines which form applies; the default value or factory return type supplies the map’s value type.

```birdie
map(0)       # default value 0
map(int)     # factory returns 0
map(1)       # default value 1
map(list)    # fresh empty list per missing key
map(map)     # fresh map with no default per missing key
map(stack)   # fresh empty stack per missing key
map(set)     # fresh empty set per missing key
map(counter) # fresh empty counter per missing key
map(queue)   # fresh empty queue per missing key
```

A default value is evaluated when the map is constructed. A factory is called only when `m[key]` encounters a missing key. The result is stored under that key and returned without copying. Later lookups return the stored value.

Mutable value defaults such as `map([])` or `map(list())` are type errors. Use a factory such as `map(list)` to create a separate collection for each missing key.

Callable arguments always mean factories. To use a function as a stored default value, provide a factory that returns that function. Custom factories can construct nested collections; each missing-key lookup calls the factory independently. Any sharing between returned values is controlled by the factory.

### Snapshots and shared values

`m.values()` copies only the outer container. Later changes to map entries do not update the returned list. Nested mutable collections remain shared with the map.

Direct [map traversal](/docs/specification#loops) uses `for key, value in m:`. Map iteration order remains open and also determines the order of `values()`.

See [Group Anagrams](/examples#group-anagrams) for a map with a list factory and a values snapshot.

## Counters

`counter[T]` is a mutable, hash-based collection mapping keys of type `T` to signed `int` counts. Counts are always integers; the type argument describes the keys.

### Construction

`counter()` creates a fresh empty counter and infers its key type from usage. An annotation such as `counts: counter[int] = counter()` can resolve an otherwise ambiguous type. Conflicting constraints are type errors.

`counter(source)` eagerly counts the elements of a list or string into a fresh counter. Each element contributes one to its key's count. Strings yield `char` keys; lists yield keys of their element type.

```birdie
letters = counter("abb")
words = counter(["bird", "bird", "tree"])

letters['a']  # 1
letters['b']  # 2
letters['z']  # 0; no insertion
letters.size # 2
```

- `letters` has type `counter[char]`; `words` has type `counter[str]`.
- Empty sources create empty counters, with key types inferred from the source type or other constraints.
- Keys require stable equality and hashing, as with sets. Mutable collections and records without defined equality and hashing cannot be keys.
- The constructor accepts zero arguments or one list/string source. Other argument types or counts are type errors. Counting does not modify the source.
- String counting follows the stored Unicode scalar sequence. No normalization, case conversion, or alphabet restriction is implicit.

### Counts and zero removal

For `counts: counter[T]`, `key` must have type `T` and assigned counts must be `int`.

| Operation | Returns | Mutates | Behavior |
| --- | --- | --- | --- |
| `counts[key]` | `int` | No | Return the count, or zero if absent. |
| `counts[key] = value` | No value | Yes | Store a nonzero count, or remove the key if the value is zero. |
| `counts[key]++` | No value | Yes | Increase the count by one, applying zero removal. |
| `counts[key]--` | No value | Yes | Decrease the count by one, applying zero removal. |
| `counts.size` | `int` | No | Read the number of keys with nonzero counts. |

- Missing-key reads never insert. Writing zero to an absent key leaves it absent.
- Negative counts are allowed. Decrementing an absent key stores `-1`; incrementing that count to zero removes the key.
- The zero-removal rule applies to every count write, including compound assignment, tuple assignment, `swap!`, `min!`, and `max!`.
- `.size` counts distinct stored keys, not the sum of their counts. It cannot be assigned to.
- A counter is false when it has no nonzero counts and true otherwise. Negative counts contribute to truthiness; counts that sum to zero across different keys do not make the counter empty.
- Assignment and argument passing share the same counter. Mutations are visible through aliases, without an implicit copy.
- Incompatible key types and noninteger count assignments are type errors.

```birdie
balance = counter()
balance['a']--  # stores -1
balance['a']++  # removes the key
balance.size   # 0
```

### Iteration and order

`for key, count in counts:` visits the nonzero entries of a `counter[T]`, binding a key of type `T` and an integer count. This associative key/count form is distinct from index/value iteration over a list.

```birdie
for num, freq in freqs:
    buckets[freq].push(num)
```

- Visit keys in insertion order. `counter(source)` orders distinct keys by their first appearance in the source.
- Changing an existing nonzero count preserves that key's position. Missing-key reads and writing zero to an absent key do not affect order.
- A zero write removes the key and its position. A later nonzero write to that key appends it at the end.
- Newly inserted negative counts follow the same ordering rules as positive counts.
- Bindings receive each entry's values using normal assignment semantics; reassigning a loop variable does not update the stored count.
- Traversal visits every stored key once and does not sort by key or frequency.

Single-binding, indexed, tuple-pattern, and reverse counter traversal remain open. Mutation of the counter during traversal follows the existing open question about collection iteration.

See [Top K Frequent Elements](/examples/top-k-frequent-elements) for reproducible bucket contents using this order.

### Equality

Two counters with the same key type compare equal when every key has the same integer count, independently of insertion order. Missing counts are zero, and zero counts are never stored. `!=` is the inverse of `==`.

```birdie
counter("anagram") == counter("nagaram")  # true
counter("abb") == counter("ab")          # false
```

Equality compares counts, including negative values. It does not compare object identity, and it does not implicitly compare a counter to a map or to a counter with a different key type.

The intended hash-table costs are expected constant-time count lookups and amortized expected constant-time updates, plus key hashing, equality, and integer arithmetic costs. Construction counts every source element; counter equality can inspect all nonzero keys. Storage is proportional to the number of nonzero keys and the sizes of their values.

Membership syntax, bulk updates, count arithmetic between counters, and additional convenience methods remain open.

See the notes on [Valid Anagram](/examples/valid-anagram#notes) for a frequency-based alternative. Its primary solution keeps the fixed 26-slot list.

## Sets

`set[T]` is a mutable, hash-based collection of distinct values of type `T`. Create a fresh empty set with `set()` and infer its element type from usage:

```birdie
seen = set()
seen.add(3)
```

Here, `seen` has type `set[int]`. As with other empty collections, insufficient or conflicting type constraints are errors. An explicit annotation such as `seen: set[int] = set()` can resolve an otherwise ambiguous element type.

### Construction from a source

`set(source)` eagerly collects the distinct elements of a list or string into a fresh set. List elements determine the set element type; a string produces `set[char]` using its stored Unicode scalar sequence.

```birdie
numsSet = set(nums)
letters = set("abb")
```

- Preserve the order in which distinct values first appear. Repeated values do not add another entry or change its position.
- An empty source creates an empty set. Its element type must still be determined by the source type or other constraints.
- The source is evaluated once and is not modified. Construction uses ordinary element assignment, equality, and hashing semantics.
- The constructor accepts zero arguments or one list/string source. Other argument types and counts are type errors. Hashability requirements apply to source elements as well as individual insertions.

### Operations

For `s: set[T]`, `value` must have type `T`.

| Operation | Returns | Mutates | Behavior |
| --- | --- | --- | --- |
| `s.add(value)` | No value | Yes, if absent | Insert the value if it is not already present. |
| `value in s` | `bool` | No | Test whether an equal value is present. |
| `s.size` | `int` | No | Read the number of distinct stored values. |

- Adding an equal value again is a no-op: it neither raises an error nor increases the size.
- Membership never inserts a value. It returns false for an absent value, including on an empty set.
- Element types require stable equality and hashing; `int` satisfies this requirement. Mutable collections cannot be elements. Record elements remain unsupported while record equality and hashing are undecided.
- An incompatible value passed to `add` or used in membership is a type error. `add` produces no value and cannot be used as a condition or assigned to a variable.
- Empty sets are false in conditions; nonempty sets are true. `not s` tests whether a set is empty.
- Assignment and argument passing share the same set. They do not make an implicit copy.
- Sets have no positional indexing, and `.size` cannot be assigned to.
- The intended hash-table costs are expected constant-time membership and amortized expected constant-time insertion, in addition to hashing and equality costs. Collision-heavy cases can require linear work; integers are not assumed to have constant-size representations.

### Set iteration and order

`for value in values:` visits a set's distinct elements in insertion order, binding each value with its element type.

```birdie
for num in numsSet:
    if num - 1 in numsSet:
        continue
```

- This is value traversal, with no implicit index. Each stored value is visited once; values are not sorted.
- `set(source)` uses first-appearance order. Adding a new value appends it to the traversal order; adding an existing value or checking membership leaves that order unchanged.
- Reassigning the loop binding does not replace the stored value.
- The same single-value traversal is available to comprehension clauses and generator expressions.

Set literals, additional source types, removal, indexed/reverse traversal, and set algebra remain open. Mutation during iteration follows the existing open question about collection traversal.

See [Contains Duplicate](/examples/contains-duplicate) for an early-return scan using a set.
See [Longest Consecutive Sequence](/examples/longest-consecutive-sequence) for construction from a list and ordered set traversal.
