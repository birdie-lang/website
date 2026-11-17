---
title: Language basics
description: Variables, lists, maps, stacks, queues, conditions, and iteration in Birdie.
navTitle: Language basics
section: guide
order: 2
---

These examples use the current draft syntax. Complete solutions are on the [algorithm examples](/docs/examples/) page.

## Variables and types

Use `=` to create a variable or assign a new value to an existing one:

```birdie
count = 0
count = count + 1
```

Birdie infers `count` as `int`. Reassignments must match that type. You can write an annotation when it helps: `count: int = 0`.

Static types describe the data and catch incompatible operations. Some assumptions are checked at runtime: indices must be in bounds, and an optional value used where a present value is required must actually be present. The algorithm does not need extra assertion or unwrapping syntax solely to establish those facts.

Variables first assigned inside a branch or loop belong to the enclosing function and can be used after the block. Their types are still checked statically. If execution reaches a read before that variable has received a value, Birdie raises a runtime error. This is lexical function scope; a function does not look up variables in its caller. See [scope and initialization](/docs/specification/types/#scope-and-initialization) for the exact rules.

Names use `camelCase`, such as `currentLength`. User-defined types use `PascalCase`, such as `TreeNode`. See [naming conventions](/docs/specification/#naming-conventions) for the full convention.

Strings use double quotes, and individual characters use single quotes:

```birdie
word = "bird"
letter = 'b'
```

Both strings and characters use Unicode. A character is one Unicode scalar value; a visible symbol can contain several of them.

## Numbers and infinity

`int` holds finite integers of arbitrary size. Use `number` when a value can also be negative or positive infinity. The built-in `-inf` and `inf` bounds compare exactly with integers, without converting them to floats:

```birdie
best = inf
min!(best, 7)
min!(best, 3)  # best is now 3
```

See [Validate Binary Search Tree](/docs/examples/validate-binary-search-tree/) for recursive bounds, or the [numeric rules](/docs/specification/types/#numbers-and-infinity) for arithmetic and finite-value checks.

## Lists

`list[int]` means a growable list of integers. List literals use square brackets:

```birdie
nums = [3, 1, 4]
nums.push(1)
first = nums[0]
size = nums.size
ordered = nums.sorted()
```

Indices start at zero. Negative indices are errors. `push` adds an item at the end; `sorted()` produces a new list and leaves `nums` unchanged.

## Maps, stacks, and queues

Collections are built in, so no imports are needed. An empty map can get its types from later use:

```birdie
seen = map()
seen["bird"] = 1
```

Here, `seen` becomes `map[str, int]`. A missing lookup such as `seen["cat"]` would be an error. Use `seen.get("cat", 0)` to supply a fallback without adding an entry.

Use a default when missing keys should be inserted automatically:

```birdie
counts = map(0)
counts["bird"]++
```

`map(list)` works similarly, creating a fresh list for each missing key. See [map defaults](/docs/specification/collections/#default-values-and-factories) for the full rules.

A stack makes last-in, first-out access explicit:

```birdie
opened = stack()
opened.push('(')
latest = opened.peek()
removed = opened.pop()
```

`peek()` reads the top item; `pop()` removes and returns it. Both require a nonempty stack.

A queue uses the same method names for first-in, first-out access:

```birdie
pending = queue([1, 2])
pending.push(3)
first = pending.peek()  # 1
removed = pending.pop() # 1; the queue now contains 2, 3
```

`queue()` creates an empty queue. `queue(items)` takes the elements of a list or string in order; `[root]` supplies a single node. `push()` adds at the back, and `peek()` and `pop()` access the front. Both front operations require a nonempty queue.

## Conditions

Use `if`, `else if`, and `else`. Empty collections, including stacks and queues, are false in conditions:

```birdie
if not opened:
    opened.push('[')
else:
    opened.pop()
```

Numbers need an explicit comparison such as `count != 0`. Use `root == none` or `root != none` to ask about optional absence or presence. An optional boolean or collection can be used for its contained truth value; if it is absent, that use raises a runtime error instead of treating absence as false. Records have no truthiness.

`not` produces a boolean. `and` skips its right operand when the left is false; `or` skips it when the left is true. Both return a boolean.

Comparisons can be chained:

```birdie
if 0 <= index < items.size:
    return items[index]
```

The chain checks adjacent pairs from left to right, evaluates each operand at most once, and stops at the first false comparison. `not lower < value < upper` negates the complete chain. See [chained comparisons](/docs/specification/types/#chained-comparisons) for the exact rules.

## Loops

A loop can request values alone or both indices and values:

```birdie
total = 0
for num in nums:
    total = total + num

positions = map()
for i, num in nums:
    positions[num] = i
```

Use parentheses to unpack a tuple: `for (x, y) in points:`. Add an index with `for i, (x, y) in points:`.

Integer ranges use `until` for an exclusive end and `through` for an inclusive end. A positive `step` skips values. The following loop headers show the values they visit:

```text
for i in 0 until 4:                 # 0, 1, 2, 3
for i in 0 through 4:               # 0, 1, 2, 3, 4
for i in 0 until 8 step 2:          # 0, 2, 4, 6
for i in reverse 0 until 8 step 2:  # 6, 4, 2, 0
```

Place `reverse` immediately after `in` to traverse a list, string, or range backwards. Indexed loops keep the original indices.

`while condition:` repeats while its condition is true.

Use `repeat count:` when you need a fixed number of repetitions without an index:

```birdie
repeat pending.size:
    node = pending.pop()
    # Process this node and enqueue its children.
```

The count is evaluated once on entry. Nodes added during the body do not increase the active repetition count. Zero or negative counts skip the body. See [Binary Tree Level Order Traversal](/docs/examples/binary-tree-level-order-traversal/) for a complete example.

## Where to go next

Read the [algorithm examples](/docs/examples/) to see these pieces together. For exact rules and open questions, use the [draft specification](/docs/specification/).
