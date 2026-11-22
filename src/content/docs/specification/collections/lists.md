---
title: Lists
description: List construction, indexing, slicing, and operations.
navTitle: Lists
section: specification
order: 5
---

`list[T]` is a growable list. `list[int]` holds integers, `list[(int, int)]` holds pairs, and `list[list[str]]` holds lists of strings.

Create an empty list with `list()` or `[]`, or use a literal such as `[1, 2, 3]`. Birdie infers the element type from usage and requests an annotation when there is not enough information.

## Filled construction

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
- Mutable fill values are type errors, even for a zero count. Use a factory to create mutable elements independently, following the [map-default convention](/docs/specification/collections/maps-sets-counters#default-values-and-factories).
- `list(3, list)` constructs three independent empty lists. `list(3, list())` is an error because it would reuse one mutable list. A custom factory can deliberately return shared values; sharing is controlled by that factory.
- Callable arguments always mean factories. To fill a list with a function value, use a factory that returns that function.
- Construction writes `count` elements and allocates storage proportional to the count. Factory evaluation adds its own work. No uninitialized elements are exposed.

The one-argument `list(source)` conversion form and index-aware factories remain open. `list(count)` does not imply a default element value.

See [Valid Anagram](/docs/examples/valid-anagram) for a fixed-alphabet frequency table constructed with `list(26, 0)`.

## Comprehension construction

`[expression for ...]` eagerly constructs a fresh list. Its clauses reuse ordinary loop bindings and traversals, including ranges and zero-start `until` shorthand. Multiple clauses act as nested loops and produce a flat list.

```birdie
column = [board[r][i] for r until 9]
```

The expression determines the element type; each result is stored using normal assignment semantics. Bindings stay local to the comprehension. See [list comprehensions](/docs/specification#list-comprehensions) for evaluation order, scope, and nested clauses.

## Operations

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
| `items.index(value)` | `int?` | No | Find the first matching index, or return `none`. |
| `items.iter()` | `iterator[T]` | No | Create an independent forward cursor without copying the list. |
| `items[start:end]` | `list[T]` | No | Allocate a shallow copy from `start` up to, excluding, `end`. |
| `items[:end]` | `list[T]` | No | Allocate a shallow copy of the first `end` elements. |
| `items[start:]` | `list[T]` | No | Allocate a shallow copy from `start` to the end. |
| `items[:]` | `list[T]` | No | Allocate a shallow copy of the whole list. |

Use `push` to add an element; there is no `append` alias. `pop()` and `.last` cause a runtime error on an empty list. `sorted()` requires an element type with a defined ordering and leaves the original list unchanged.

## Index lookup

`items.index(value)` scans from the beginning and returns the first zero-based matching index as `int?`. If no element matches, including in an empty list, it returns `none`.

```birdie
items = [4, 2, 4]
first = items.index(4)   # 0
missing = items.index(9) # none
```

- Exactly one search value is required and must fit the list's element type. Evaluate the receiver and search expression once, in that order, before searching. The lookup does not modify the list.
- The element type must have defined value equality. Compare elements using those existing rules, from first to last, and stop at the first match. This operation does not add equality for records, lists, or optional payloads whose equality remains unspecified.
- A found index of zero is a present result. Use `position != none` to test for a match. A valid-input guarantee can also justify using the result directly where `int` is required, through the ordinary checked optional-use rules.
- Lookup performs at most one equality comparison per element. It uses O(1) auxiliary space; the cost of each comparison follows the element type's equality rules.

See [Construct Binary Tree from Preorder and Inorder Traversal](/docs/examples/construct-binary-tree-from-preorder-and-inorder-traversal) for locating each subtree's root value.

## Bulk insertion

For `items: list[T]`, `items.extend(other)` requires another `list[T]`. It appends the source elements in their original order, mutates the existing destination list, and produces no result value.

- Evaluate the receiver and source expressions once, in that order.
- An empty source is a no-op. Incompatible source types are type errors.
- Copy element values using normal assignment semantics. Nested mutable values stay shared; no deep copy is made.
- Self-extension appends the original contents once. For example, extending `[1, 2]` with itself produces `[1, 2, 1, 2]`, rather than traversing its newly appended tail.
- Work includes copying the appended elements and any destination-storage growth. There is no separate result list.

## Joining strings

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

See [Encode and Decode Strings](/docs/examples/encode-and-decode-strings) for collecting fragments and joining once.

<a id="prefix-slicing"></a>

## Slicing

`items[start:end]` creates a fresh `list[T]` containing elements from the inclusive `start` index to the exclusive `end` index, preserving order. An omitted start means zero; an omitted end means the source size.

```birdie
items = [10, 20, 30, 40]
middle = items[1:3] # [20, 30]
prefix = items[:2]  # [10, 20]
suffix = items[2:]  # [30, 40]
copy = items[:]    # [10, 20, 30, 40]; separate outer list
empty = items[2:2] # []
```

- Bounds require finite integers under the ordinary checked-use rules and must satisfy `0 <= start <= end <= items.size`. Incompatible types are compile-time errors. Negative, reversed, or oversized bounds cause runtime errors; they are never clamped or interpreted relative to the end.
- Evaluate and retain the source first, then each explicit bound once, from left to right. Apply required presence and finite-value checks to each operand before evaluating the next. Supply omitted bounds after those evaluations, reading the retained source's current size for an omitted end, then validate the range. Reassigning the source variable during bound evaluation does not replace the retained source object.
- The result contains `end - start` elements. Equal bounds produce an empty list, including `items[items.size:]`. Empty sources support `items[:]` and `items[0:0]`.
- Every slice creates a separate outer list, even `items[:]` and empty slices. Replacing entries in the result does not change the source. Nested records and collections remain shared through ordinary assignment semantics; there is no deep copy or mutable view.
- Copying `k` elements takes O(k) work and storage, plus constant overhead. Bounds checks complete before elements are copied; a failing slice does not undo side effects from evaluating its source or bounds.

For example, `items[-1:]`, `items[3:1]`, and `items[:5]` all fail for the four-element list above. Slice steps and slice assignment remain open. [String slicing](/docs/specification/values-and-operators#string-slicing) uses the same omitted-bound and strict exclusive-end conventions, with Unicode scalar positions.

See [Top K Frequent Elements](/docs/examples/top-k-frequent-elements) for bulk insertion followed by a bounded prefix copy.

See [Construct Binary Tree from Preorder and Inorder Traversal](/docs/examples/construct-binary-tree-from-preorder-and-inorder-traversal) for middle and suffix copies.

## Size and indexing

`.size` is read-only. List and string indices are zero-based and must satisfy `0 <= i < value.size`. Negative and out-of-bounds indices cause a runtime error.

For strings, size and indices count Unicode scalar values. String indexing returns a `char`; strings are immutable.
