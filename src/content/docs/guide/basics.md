---
title: Language basics
description: Variables, lists, maps, stacks, conditions, and iteration in Birdie.
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

Names use `camelCase`, such as `currentLength`. User-defined types use `PascalCase`, such as `TreeNode`. See [naming conventions](/docs/specification/#naming-conventions) for the full convention.

Strings use double quotes, and individual characters use single quotes:

```birdie
word = "bird"
letter = 'b'
```

Both strings and characters use Unicode. A character is one Unicode scalar value; a visible symbol can contain several of them.

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

## Maps and stacks

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

## Conditions

Use `if`, `else if`, and `else`. Empty lists, maps, and stacks are false in conditions:

```birdie
if not opened:
    opened.push('[')
else:
    opened.pop()
```

Numbers need an explicit comparison such as `count != 0`. Optional values need explicit absence or presence checks such as `root == none` or `root != none`.

`not` produces a boolean. `and` skips its right operand when the left is false; `or` skips it when the left is true. Both return a boolean.

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

## Where to go next

Read the [algorithm examples](/docs/examples/) to see these pieces together. For exact rules and open questions, use the [draft specification](/docs/specification/).
