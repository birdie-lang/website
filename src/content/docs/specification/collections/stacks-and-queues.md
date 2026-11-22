---
title: Stacks & queues
description: Last-in, first-out stacks and first-in, first-out queues.
navTitle: Stacks & queues
section: specification
order: 7
---

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

See [Binary Tree Level Order Traversal](/docs/examples/binary-tree-level-order-traversal) for FIFO processing with [`repeat`](/docs/specification#counted-repetition).
