---
title: Collections
description: Birdie’s collection types, operations, map defaults, and copy behavior.
navTitle: Collections
section: specification
order: 2
---

Lists, maps, and stacks are built in and require no imports.

For lists, stacks, maps, and strings, `.size` is a read-only `int`: element count for lists and stacks, entry count for maps, and Unicode scalar count for strings.

## Lists

`list[T]` is a growable list. `list[int]` holds integers, `list[(int, int)]` holds pairs, and `list[list[str]]` holds lists of strings.

Create an empty list with `list()` or `[]`, or use a literal such as `[1, 2, 3]`. Birdie infers the element type from usage and requests an annotation when there is not enough information.

For `items: list[T]`, `value` must have type `T` and `i` must have type `int`.

| Operation | Returns | Mutates | Behavior |
| --- | --- | --- | --- |
| `items.push(value)` | No value | Yes | Add one element at the end. |
| `items.pop()` | `T` | Yes | Remove and return the last element. |
| `items[i]` | `T` | No | Read an element at a valid index. |
| `items[i] = value` | No value | Yes | Replace an element at a valid index. |
| `items.last` | `T` | No | Read the last element. |
| `items.size` | `int` | No | Read the number of elements. |
| `items.sorted()` | `list[T]` | No | Allocate a new list in ascending order. |

Use `push` to add an element; there is no `append` alias. `pop()` and `.last` cause a runtime error on an empty list. `sorted()` requires an element type with a defined ordering and leaves the original list unchanged.

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
```

A default value is evaluated when the map is constructed. A factory is called only when `m[key]` encounters a missing key. The result is stored under that key and returned without copying. Later lookups return the stored value.

Mutable value defaults such as `map([])` or `map(list())` are type errors. Use a factory such as `map(list)` to create a separate collection for each missing key.

Callable arguments always mean factories. To use a function as a stored default value, provide a factory that returns that function. Custom factories can construct nested collections; each missing-key lookup calls the factory independently. Any sharing between returned values is controlled by the factory.

### Snapshots and shared values

`m.values()` copies only the outer container. Later changes to map entries do not update the returned list. Nested mutable collections remain shared with the map.

Map iteration order and single-binding map iteration remain undecided, so no particular ordering of `values()` is specified yet.

See [Group Anagrams](/docs/examples/#group-anagrams) for a map with a list factory and a values snapshot.

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

## Further candidates

Heaps, queues/deques, sets, and counters are priorities for exploration. Sorted sets, union-find, tries, and graph/grid helpers are also candidates. Their APIs have not been defined here.
