---
title: Syntax & execution
description: Source layout, function visibility, loops, comprehensions, and ranges.
navTitle: Syntax & execution
section: specification
order: 0
---

This specification records the agreed language design. The other chapters cover [types and variables](/docs/specification/types/) and [collections](/docs/specification/collections/).

## Naming conventions

Use `camelCase` for variables, parameters, functions, methods, and record fields: `currentLength`, `longestConsecutive`, and `leftChild`.

Use `PascalCase` for user-defined types, such as `TreeNode` and `GraphEdge`.

These are style conventions rather than syntax restrictions.

## Source layout

- Top-level code has no indentation.
- Each block adds exactly four spaces. Tabs in indentation are errors.
- Block indentation increases only after a block header ending in `:`.
- Dedenting can close multiple blocks.
- Blank lines and comment-only lines do not change block structure.

### Multiline expressions

- Outside open delimiters, a newline ends the statement.
- Inside `()`, `[]`, or `{}`, newlines continue the expression without creating blocks.
- Multiline contents use four additional spaces relative to the opening line.
- Closing delimiters align with the opening line's indentation.
- Trailing commas are allowed.
- Backslash-based line continuation is not supported.

```birdie
nums = [
    1,
    2,
    3,
]
```

### Comments

`#` starts a comment outside quoted literals and continues to the newline. Full-line and inline comments are allowed.

## File execution

- Files can contain record type definitions, function definitions, and top-level statements.
- Parse and type-check the whole file before executing anything.
- Register its top-level `fn` declarations before executing ordinary statements, allowing calls to functions written later in the file.
- Execute top-level statements in source order. Function bodies run only when called.
- No `main` function is required. An ordinary `main` can be called explicitly.

## Functions

Declaration form:

```text
fn name(param: Type) ReturnType:
    body
```

- Declare functions with `fn` and explicit parameter types.
- The optional return type follows `)`, without an arrow.
- The colon and indentation define the function body.
- Return type inference follows the [typing rules](/docs/specification/types/#inference).
- Functions can call themselves recursively. An explicit return annotation supplies the type needed to check recursive calls; broader recursive return inference remains open.

[`swap!`, `min!`, and `max!`](/docs/specification/types/#in-place-operations) are built-in in-place operations with parentheses. Their specified writable arguments identify caller locations; they are standalone statements rather than ordinary function values.

### Definition visibility

- Named functions declared directly in a file or function body are visible throughout that body, regardless of their position in the source.
- Register those declarations when entering the body, before executing its ordinary statements. Registration does not execute the declared functions or change the order of variable initialization.
- A function can call a helper written below it. Separate helpers are preferred when they need no captured variables; the main algorithm can appear first.
- A nested helper can capture an enclosing binding before its initializer executes, but it cannot read that binding before definite initialization. Forward function references do not initialize captured variables early.
- Duplicate function declarations with the same name in one scope are errors.

These are language semantics shared by the planned interpreter and VM. Declarations inside conditional or loop blocks remain open.

### Nested functions

An `fn` definition can appear inside another function. The nested function has lexical scope: it can read visible enclosing variables, and its name is local to the enclosing function. It can call itself recursively.

```birdie
fn countNodes(root: TreeNode?) int:
    count = 0

    fn visit(node: TreeNode?) int:
        outer count

        if node is none:
            return 0

        count++
        visit(node.left)
        visit(node.right)
        return count

    visit(root)
    return count
```

- Each invocation has its own parameters and local variables, including during recursion.
- Reading an enclosing variable needs no declaration. Check captured values using the enclosing binding's static type, without assuming a caller's temporary narrowing.
- Rebinding an enclosing variable requires [`outer name`](/docs/specification/types/#outer-variables). Ordinary assignments inside the nested function create or update its own locals.
- Captures refer to bindings rather than copying their values. All calls to the same nested helper see updates to its captured bindings.
- A separate call to the enclosing function creates fresh local bindings and a new helper capturing those bindings.
- Nested functions follow the same parameter and return typing rules as other functions; their enclosing types are available during checking.

See [Diameter of Binary Tree](/docs/examples/diameter-of-binary-tree/) for a recursive helper that updates an outer accumulator.

## Branches

Branches use `if condition:`, `else if condition:`, and `else:`. Branch headers share an indentation level; each body is one level deeper.

Conditions follow the [truthiness rules](/docs/specification/types/#booleans-and-truthiness).

## Loops

`while condition:` tests the condition before each iteration and stops when false.

For lists and strings:

| Loop header | Bindings |
| --- | --- |
| `for value in items:` | Value |
| `for i, value in items:` | Zero-based index and value |
| `for (x, y) in points:` | Unpacked tuple |
| `for i, (x, y) in points:` | Index and unpacked tuple |

String iteration yields `char` values. Parentheses distinguish tuple unpacking from an index-and-value loop.

For sets, `for value in values:` visits each distinct element in insertion order. See [set iteration](/docs/specification/collections/#set-iteration-and-order). Indexed and reverse set forms remain open.

For counters, `for key, count in counts:` binds each stored key and its integer count in insertion order. See [counter iteration](/docs/specification/collections/#iteration-and-order). Single-binding and indexed counter forms remain open.

For maps, `for key, value in counts:` is a proposal. Single-binding and indexed forms, along with map iteration order, remain open.

Lists and strings can be traversed together using [`zip`](/docs/specification/collections/#parallel-iteration):

```birdie
for (c1, c2) in zip(s, t):
    freqs[c1 - 'a']++
    freqs[c2 - 'a']--
```

The sources must have equal lengths. The parentheses unpack a pair; `for c1, c2 in zip(s, t):` is not the pair-unpacking form.

### Continue

`continue` is a standalone statement that skips the remainder of the current iteration of the nearest enclosing loop in the same function.

- A `for` loop advances to its next value. A `while` loop reevaluates its condition.
- It does not restart the loop or repeat its initialization.
- Use outside a loop, including inside a helper called by a loop but with no loop of its own, is a compile-time error.
- Comprehensions contain expressions, so `continue` cannot appear inside them.

### Generator expressions

An expression followed by one or more `for` clauses describes a lazy traversal. Clauses reuse ordinary loop bindings and traversal forms, including ranges, counter key/count bindings, and `zip`. Bindings are local to the expression. The first use is the [`all` predicate check](/docs/specification/collections/#predicate-expressions-and-all):

```birdie
return all(value == 0 for value in freqs)
```

When a generator is the sole argument of a call, the call's parentheses also delimit the generator. Multiple clauses follow the nesting and scope rules below. General generator values, their type syntax, escaping lifetimes, and comprehension filters remain open.

### List comprehensions

Brackets make a comprehension eager: evaluate its expression for each combination of loop bindings and append the results to a fresh list.

```birdie
column = [board[r][i] for r until 9]

square = [
    board[r][c]
    for r in sr until sr + 3
    for c in sc until sc + 3
]
```

- Reuse the same `for` clauses as ordinary loops, including the zero-start `until` shorthand and explicit starts and steps.
- Multiple clauses execute from left to right as nested loops. In the square example, choose a row, visit its columns, then advance to the next row. The result is one flat list of nine cells.
- Evaluate each clause's source or range bounds once per entry into that traversal. Inner sources can depend on earlier bindings and are reevaluated for each preceding combination. An empty traversal skips its inner clauses and element expression.
- Evaluate the element expression only after every clause has a bound value. List comprehensions evaluate all reached elements immediately; generator expressions evaluate them as values are consumed.
- Bindings belong to the comprehension. They do not replace enclosing variables and are not visible afterwards. Nested sources and the element expression can read preceding bindings and visible enclosing variables.
- Infer the list element type from the expression and available constraints, even for an empty traversal. Insufficient or conflicting types are errors; do not introduce a dynamic element type.
- Store element values using normal assignment semantics. Mutable results remain references; comprehension construction does not deep-copy them.
- Filters, dictionary/set comprehensions, and asynchronous forms remain open.

See [Valid Sudoku](/docs/examples/valid-sudoku/) for eager column and square construction with a separate validation helper.

### Ranges

- `start until end`: include the start, exclude the end.
- `start through end`: include both bounds.
- Bounds are integers. Forward iteration increases by `step`, defaulting to `1`.
- An explicit `step` must be a positive integer. Nonpositive steps are invalid.
- An inclusive end is visited only if the step lands on it.
- A start greater than the end produces an empty range. `until` is also empty when the bounds are equal.
- Range iteration does not materialize a list.
- Evaluate a traversal's bounds and step once when it starts; changing variables used by those expressions does not change an active traversal's bounds.

For a zero-start forward range, `for i until end:` is shorthand for `for i in 0 until end:`. `for i until end step amount:` has the same meaning with an explicit positive step. The shorthand accepts one integer binding and works in comprehension clauses too. Inclusive and reverse ranges keep their full forms in this draft.

| Loop header | Values |
| --- | --- |
| `for i in 0 until 4:` | `0, 1, 2, 3` |
| `for i until 4:` | `0, 1, 2, 3` |
| `for i until 9 step 3:` | `0, 3, 6` |
| `for i in 0 through 4:` | `0, 1, 2, 3, 4` |
| `for i in 0 through 7 step 2:` | `0, 2, 4, 6` |
| `for i in reverse 0 until 8 step 2:` | `6, 4, 2, 0` |

### Reverse iteration

- `reverse` is a reserved keyword, placed immediately after `in`.
- Reverse the generated sequence after applying any step. Empty sequences stay empty.
- Support lists, strings, and finite integer ranges without materializing a reversed copy.
- Indexed list and string loops preserve original indices, not traversal counters.
- Tuple unpacking works with reversed iteration.

| Loop header | Bindings |
| --- | --- |
| `for value in reverse nums:` | Values in reverse order |
| `for i, value in reverse nums:` | Original index and value; `nums[i] == value` |
| `for i, (x, y) in reverse points:` | Original index and unpacked tuple |

## Open questions

- Single-binding map iteration and index + key + value syntax.
- Map iteration order and reverse iteration over maps.
- Mutation during collection iteration.
- Returning nested functions, function type syntax, and escaping capture lifetimes.
- Function declarations inside conditional or loop blocks.
