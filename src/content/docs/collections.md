---
title: Collections
description: The proposed list, map, and stack behavior in Birdie.
navTitle: Collections
order: 2
---

Birdie’s design makes commonly used algorithmic data structures directly available, without imports.

> **Design, not a released API**
>
> The collections below are proposed. The language implementation is still ahead of us.

## Lists

`[T]` is a growable list. `[int]` is a list of integers, and `[(int, int)]` is a list of integer pairs.

- `.size` is the read-only element count.
- `values[i]` uses zero-based indexing.
- Negative and out-of-bounds indices cause a runtime error.
- `.last` returns the final element; an empty list causes a runtime error.

Lists can also support `push` and `pop` at the end.

## Maps

Create an empty map with `map()`. Birdie should infer its key and value types from usage and request an annotation if there is not enough information.

```birdie
seen = map()
seen[num] = i
```

`key in seen` tests membership. `seen[key]` looks up a value; a missing key causes a runtime error. Assignment inserts a new entry or replaces an existing one. `.size` counts entries.

A populated map can use a literal:

```birdie
matching = {')': '(', ']': '[', '}': '{'}
```

Map iteration order and single-binding map iteration remain undecided.

## Stacks

`stack()` creates a dedicated LIFO collection. Its element type is inferred from use.

```birdie
opened = stack()
opened.push(char)
```

- `push(value)` adds an element to the top.
- `pop()` removes and returns the top element; an empty stack causes a runtime error.
- `.size` counts elements.
- `if not opened:` tests whether the stack is empty.

A stack has no indexing, arbitrary insertion, or sorting. Its restricted interface makes the intended algorithm explicit.

## Further candidates

Heaps, queues/deques, sets, and counters are priorities for exploration. Sorted sets, union-find, tries, and graph/grid helpers are also candidates. Their APIs have not been defined here.
