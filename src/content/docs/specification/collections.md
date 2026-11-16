---
title: Collections
description: Birdie’s lists, maps, counters, sets, stacks, queues, construction, and copy behavior.
navTitle: Collections
section: specification
order: 2
---

Lists, maps, counters, sets, stacks, and queues are built in and require no imports.

Collections and strings expose a read-only `int` property, `.size`. It counts list, stack, or queue elements, map entries, distinct set elements, counter keys with nonzero counts, or Unicode scalar values in a string.

The operation types below describe present values. Optional receivers and operands with compatible underlying types follow [checked optional use](/docs/specification/types/#checked-optional-use); absence fails at runtime when a present value is required.

## Lists

`list[T]` is a growable list. `list[int]` holds integers, `list[(int, int)]` holds pairs, and `list[list[str]]` holds lists of strings.

Create an empty list with `list()` or `[]`, or use a literal such as `[1, 2, 3]`. Birdie infers the element type from usage and requests an annotation when there is not enough information.

### Filled construction

`list(count, initializer)` creates a growable list with `count` initialized elements. The first argument is the initial size, not reserved capacity.

```birdie
freqs = list(26, 0)
flags = list(10, false)
labels = list(5, "")
rows: list[list[int]] = list(3, list)
```

- `count` must be an `int`. A negative count causes a runtime error; zero creates an empty list.
- Evaluate the count and initializer expressions once, from left to right, following normal argument evaluation. The initializer expression is evaluated even when the count is zero.
- A non-callable initializer is an immutable fill value, stored in every position. Infer the element type from that value.
- A callable initializer is a zero-argument factory. Call it once per position, in index order, and store each result without copying. Infer the element type from its return type. A zero count makes no factory calls.
- Insufficient or conflicting type constraints are errors, including when the count is zero. An annotation can resolve an otherwise ambiguous factory return type.
- Mutable fill values are type errors, even for a zero count. Use a factory to create mutable elements independently, following the [map-default convention](#default-values-and-factories).
- `list(3, list)` constructs three independent empty lists. `list(3, list())` is an error because it would reuse one mutable list. A custom factory can deliberately return shared values; sharing is controlled by that factory.
- Callable arguments always mean factories. To fill a list with a function value, use a factory that returns that function.
- Construction writes `count` elements and allocates storage proportional to the count. Factory evaluation adds its own work. No uninitialized elements are exposed.

The one-argument `list(source)` conversion form and index-aware factories remain open. `list(count)` does not imply a default element value.

See [Valid Anagram](/docs/examples/valid-anagram/) for a fixed-alphabet frequency table constructed with `list(26, 0)`.

### Comprehension construction

`[expression for ...]` eagerly constructs a fresh list. Its clauses reuse ordinary loop bindings and traversals, including ranges and zero-start `until` shorthand. Multiple clauses act as nested loops and produce a flat list.

```birdie
column = [board[r][i] for r until 9]
```

The expression determines the element type; each result is stored using normal assignment semantics. Bindings stay local to the comprehension. See [list comprehensions](/docs/specification/#list-comprehensions) for evaluation order, scope, and nested clauses.

### Operations

For `items: list[T]`, `value` must have type `T` and `i` must have type `int`.

| Operation | Returns | Mutates | Behavior |
| --- | --- | --- | --- |
| `items.push(value)` | No value | Yes | Add one element at the end. |
| `items.extend(other)` | No value | Yes | Append another list's elements in order. |
| `items.pop()` | `T` | Yes | Remove and return the last element. |
| `items[i]` | `T` | No | Read an element at a valid index. |
| `items[i] = value` | No value | Yes | Replace an element at a valid index. |
| `items.last` | `T` | No | Read the last element. |
| `items.size` | `int` | No | Read the number of elements. |
| `items.sorted()` | `list[T]` | No | Allocate a new list in ascending order. |
| `items[:end]` | `list[T]` | No | Allocate a shallow copy of the first `end` elements. |

Use `push` to add an element; there is no `append` alias. `pop()` and `.last` cause a runtime error on an empty list. `sorted()` requires an element type with a defined ordering and leaves the original list unchanged.

### Bulk insertion

For `items: list[T]`, `items.extend(other)` requires another `list[T]`. It appends the source elements in their original order, mutates the existing destination list, and produces no result value.

- Evaluate the receiver and source expressions once, in that order.
- An empty source is a no-op. Incompatible source types are type errors.
- Copy element values using normal assignment semantics. Nested mutable values stay shared; no deep copy is made.
- Self-extension appends the original contents once. For example, extending `[1, 2]` with itself produces `[1, 2, 1, 2]`, rather than traversing its newly appended tail.
- Work includes copying the appended elements and any destination-storage growth. There is no separate result list.

### Joining strings

For `parts: list[str]`, `parts.join(separator)` returns one `str` with the separator between adjacent elements. The collection is the receiver.

```birdie
parts = ["bird", "song"]
spaced = parts.join(" ")  # "bird song"
packed = parts.join("")   # "birdsong"
```

- Exactly one `str` separator is required. A receiver with another element type or a non-string separator is a type error; elements are not implicitly converted to strings.
- Evaluate the receiver and separator expressions once, in that order. Read elements in their existing order without changing the list or its strings.
- Empty lists produce `""`; one-element lists produce that element's text. Separators appear only between elements, with empty strings still counting as elements.
- The intended implementation constructs the result in O(n + L) work and O(L) result storage for n elements and L output scalar values, including separators. It must avoid repeatedly copying an increasingly long accumulated string.

See [Encode and Decode Strings](/docs/examples/encode-and-decode-strings/) for collecting fragments and joining once.

### Prefix slicing

`items[:end]` creates a fresh `list[T]` containing indices `0` through `end - 1`, preserving order.

- `end` must be an `int` and satisfy `0 <= end <= items.size`. Noninteger ends are type errors; negative and oversized ends cause runtime errors, following the indexing bounds discipline.
- Evaluate the source and end expression once, in that order.
- An end of zero creates an empty list. An end equal to the source size still creates a separate outer list.
- Slicing is a shallow copy. Replacing entries in the result does not change the source; nested records and collections remain shared.
- Copying a prefix of length `end` takes work and storage proportional to that length.

General start/end slicing for lists, steps, negative-bound conventions, and slice assignment remain open. [String slicing](/docs/specification/types/#string-slicing) uses the same strict bounds and exclusive end.

See [Top K Frequent Elements](/docs/examples/top-k-frequent-elements/) for bulk insertion followed by a bounded prefix copy.

### Size and indexing

`.size` is read-only. List and string indices are zero-based and must satisfy `0 <= i < value.size`. Negative and out-of-bounds indices cause a runtime error.

For strings, size and indices count Unicode scalar values. String indexing returns a `char`; strings are immutable.

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
| `m.get(key, fallback)` | `V` | No | Return the stored value or the supplied fallback. |
| `m.size` | `int` | No | Read the number of stored entries. |
| `m.values()` | `list[V]` | No | Allocate a snapshot of stored values in map iteration order. |

Only a missing-key lookup with `m[key]` obtains and inserts a configured default. Assignment, membership checks, `get`, and `values` never call the default factory.

`get` always requires an explicit fallback, including on maps with defaults. Stored values such as `0`, `false`, and empty collections are returned unchanged.

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

Map iteration order and single-binding map iteration remain undecided, so no particular ordering of `values()` is specified yet.

See [Group Anagrams](/docs/examples/#group-anagrams) for a map with a list factory and a values snapshot.

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

See [Top K Frequent Elements](/docs/examples/top-k-frequent-elements/) for reproducible bucket contents using this order.

### Equality

Two counters with the same key type compare equal when every key has the same integer count, independently of insertion order. Missing counts are zero, and zero counts are never stored. `!=` is the inverse of `==`.

```birdie
counter("anagram") == counter("nagaram")  # true
counter("abb") == counter("ab")          # false
```

Equality compares counts, including negative values. It does not compare object identity, and it does not implicitly compare a counter to a map or to a counter with a different key type.

The intended hash-table costs are expected constant-time count lookups and amortized expected constant-time updates, plus key hashing, equality, and integer arithmetic costs. Construction counts every source element; counter equality can inspect all nonzero keys. Storage is proportional to the number of nonzero keys and the sizes of their values.

Membership syntax, bulk updates, count arithmetic between counters, and additional convenience methods remain open.

See the notes on [Valid Anagram](/docs/examples/valid-anagram/#notes) for a frequency-based alternative. Its primary solution keeps the fixed 26-slot list.

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

See [Contains Duplicate](/docs/examples/contains-duplicate/) for an early-return scan using a set.
See [Longest Consecutive Sequence](/docs/examples/longest-consecutive-sequence/) for construction from a list and ordered set traversal.

## Stacks

`stack[T]` is a dedicated LIFO collection. `stack()` creates an empty stack and infers its element type from use.

```birdie
opened = stack()
opened.push(char)
```

For `s: stack[T]`, `value` must have type `T`.

| Operation | Returns | Mutates | Behavior |
| --- | --- | --- | --- |
| `s.push(value)` | No value | Yes | Add one element to the top. |
| `s.pop()` | `T` | Yes | Remove and return the top element. |
| `s.peek()` | `T` | No | Read the top element without removing it. |
| `s.size` | `int` | No | Read the number of elements. |

`pop()` and `peek()` cause a runtime error on an empty stack. Use truthiness for emptiness checks: `while s` or `if not s`.

A stack has no indexing, arbitrary insertion, or sorting.

## Queues

`queue[T]` is a dedicated FIFO collection. `push` adds at the back; `pop` and `peek` access the front.

### Construction

`queue()` creates a fresh empty queue and infers its element type from usage. `queue(source)` creates a fresh queue from a list or string, preserving source order and duplicates. String elements are `char` values.

```birdie
pending = queue([root])
numbers = queue([1, 2, 3])
groups = queue([[1, 2, 3]])
```

Here, `pending` starts with one tree node, `numbers` with three integers, and `groups` with one list. The argument is always a source sequence, so a single element needs a one-element list such as `[root]`.

- Evaluate the source once and eagerly store its elements from first to last. Construction does not modify the source or share its outer storage.
- Elements use normal assignment semantics. Records and mutable collections retain their references; their contents are not deep-copied.
- Empty sources create empty queues. Infer element types from the source and other uses; insufficient or conflicting constraints are type errors. An annotation such as `pending: queue[TreeNode] = queue()` can resolve ambiguity.
- The constructor takes zero arguments or one list/string source. Other source types and argument counts are type errors. There is no variadic element constructor or implicit singleton conversion.
- Building a queue from `n` elements takes O(n) work and storage.

### Operations

For `q: queue[T]`, `value` must fit `T` using the ordinary assignment and checked optional-use rules.

| Operation | Returns | Mutates | Behavior |
| --- | --- | --- | --- |
| `q.push(value)` | No value | Yes | Add one element at the back. |
| `q.pop()` | `T` | Yes | Remove and return the front element. |
| `q.peek()` | `T` | No | Read the front element without removing it. |
| `q.size` | `int` | No | Read the number of elements. |

`pop()` and `peek()` cause a runtime error on an empty queue. Empty queues are false in conditions; use `while q` or `if not q` for emptiness checks. All operations preserve FIFO order, including when insertions and removals are interleaved.

`pop()`, `peek()`, and `.size` take O(1) work; `push()` takes amortized O(1) work. Removing the front must not shift all remaining elements.

A queue has no indexing or sorting. Direct iteration, reverse traversal, and deque operations remain open.

See [Binary Tree Level Order Traversal](/docs/examples/binary-tree-level-order-traversal/) for FIFO processing with [`repeat`](/docs/specification/#counted-repetition).

## Lazy traversal and predicate checks

### Parallel iteration

`zip(left, right)` provides a lazy sequence of pairs from two lists or strings. The two sources can have different element types. String elements are `char` values.

```birdie
for (c1, c2) in zip(s, t):
    freqs[c1 - 'a']++
    freqs[c2 - 'a']--
```

- Evaluate both source expressions once, from left to right, when `zip` is called.
- Check their element counts at that call. Unequal lengths cause a runtime error; values are never silently truncated.
- Traverse both sources forwards, yielding one pair at a time without constructing an intermediate list of pairs.
- Two empty sources produce an empty traversal. Exactly two sources are required in this draft.
- Use parentheses to unpack a pair, following the [loop-binding rules](/docs/specification/#loops). A single binding receives the pair itself.
- Values preserve their usual assignment semantics; yielding a record or collection reference does not copy the underlying object.

Broader input types and reverse traversal of zipped values remain open. Mutation during traversal follows the existing open question about collection iteration.

### Predicate expressions and `all`

`all(predicate for ...)` checks a predicate lazily using the same bindings and traversals as an ordinary loop, including lists, strings, ranges, sets, counter key/count traversal, and `zip`:

```birdie
return all(value == 0 for value in freqs)
```

- An expression followed by one or more `for` clauses describes a lazy generator. Evaluate its outermost source or range bounds when the generator is created. Evaluate inner sources when preceding clauses produce a new combination, and evaluate the element expression only for combinations that are consumed.
- The binding takes its type from the source and is local to the generator expression. It neither replaces an enclosing binding nor leaks outside the expression. Parenthesized tuple unpacking follows the loop-binding rules.
- Expressions can read visible enclosing variables using their normal binding semantics. Values are observed when the expression is evaluated, rather than copied into a separate boolean list.
- `all` requires boolean elements and returns a `bool`. An integer predicate is a type error; it is not converted using truthiness.
- Visit elements in source order. Stop at the first false result without evaluating later predicates. An empty source returns true.
- `all` also accepts an ordinary `list[bool]`. It takes exactly one argument. A generator used as its sole argument needs no extra parentheses.
- Evaluate only the values needed to determine the result; propagate errors from evaluations that are reached. Do not materialize an intermediate list of predicate results.

Multiple clauses follow the same nesting and scope rules as [list comprehensions](/docs/specification/#list-comprehensions). Reusable generator type syntax, escaping generator lifetimes, and filtering remain open.

See [Valid Anagram](/docs/examples/valid-anagram/) for a strict zipped traversal followed by a lazy zero-count check.

## Further candidates

Heaps and deques are priorities for exploration. Sorted sets, union-find, tries, and graph/grid helpers are also candidates. Their APIs have not been defined here.
