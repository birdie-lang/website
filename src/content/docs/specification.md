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
- Nested functions can list writable captures after their parameters, as in `fn dfs(node: TreeNode?, outer res) int:`. Captures use the enclosing binding's type and are not call arguments.
- The optional return type follows `)`, without an arrow.
- The colon and indentation define the function body.
- Return type inference follows the [typing rules](/docs/specification/types/#inference).
- Functions can call themselves recursively. Value-returning recursive functions use an explicit result annotation; recursive procedures need none. Broader recursive return inference remains open.
- [Optional propagation](/docs/specification/types/#optional-propagation) with postfix `?` can return `none` early from a function with an optional result type.
- [Conditional return](/docs/specification/types/#conditional-return) with `return? expression` returns a present optional payload, or runs the next statement when absent. It can be used in functions with nonoptional or optional results.

[`swap!`, `min!`, and `max!`](/docs/specification/types/#in-place-operations) are built-in in-place operations with parentheses. Their specified writable arguments identify caller locations; they are standalone statements rather than ordinary function values.

### Procedures

A function that performs work without producing a result is a procedure. Omit the return annotation, use bare `return` to exit early, or let execution reach the end:

```birdie
fn writeTree(node: TreeNode?, parts: list[str]):
    if node == none:
        parts.push("|")
        return

    parts.push(str(node.val))
    writeTree(node.left, parts)
    writeTree(node.right, parts)
```

- With no result annotation and no value-returning statements in its own body, infer a procedure. Nested functions' returns do not affect that classification. Recursive calls do not require a result annotation in this case.
- Bare `return` and reaching the end both finish the current procedure. They produce no value, including no implicit `none`.
- Procedure calls are statements. Using one as an initializer, argument, condition, return value, or other value expression is a compile-time error. A procedure cannot serve as a factory that must return an element.
- A function with a declared or inferred result type uses `return expression`, including explicit `return none` for an absent optional result. Bare `return` is a compile-time error in a value-returning function. `return? expression` contributes a possible value return and follows its existing typing rules.
- Calling a value-returning function as a statement can discard its result. Bare `return` outside a function is an error.

See [Serialize and Deserialize Binary Tree](/docs/examples/serialize-and-deserialize-binary-tree/) for a nested procedure that collects tokens in a captured list.

### Definition visibility

- Named functions declared directly in a file or function body are visible throughout that body, regardless of their position in the source.
- Register those declarations when entering the body, before executing its ordinary statements. Registration does not execute the declared functions or change the order of variable initialization.
- A function can call a helper written below it. Separate helpers are preferred when they need no captured variables; the main algorithm can appear first.
- A nested helper can capture an enclosing binding before its initializer executes. Reading that binding before assignment raises a runtime initialization error. Forward function references do not initialize captured variables early.
- Duplicate function declarations with the same name in one scope are errors.

These are language semantics shared by the planned interpreter and VM. Function declarations inside conditional or loop blocks remain open.

### Nested functions

An `fn` definition can appear inside another function. The nested function has lexical scope: it can read visible enclosing variables, and its name is local to the enclosing function. It can call itself recursively.

```birdie
fn countNodes(root: TreeNode?) int:
    count = 0

    fn visit(node: TreeNode?, outer count) int:
        if node == none:
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
- Rebinding an enclosing variable requires an [`outer name` entry in the function header](/docs/specification/types/#outer-variables). Calls supply only ordinary parameters; `visit(root)` does not pass `count`. Ordinary assignments to names without a writable capture create or update the nested function's own locals.
- Captures refer to bindings rather than copying their values. All calls to the same nested helper see updates to its captured bindings.
- A separate call to the enclosing function creates fresh local bindings and a new helper capturing those bindings.
- Nested functions follow the same parameter and return typing rules as other functions; their enclosing types are available during checking.

See [Diameter of Binary Tree](/docs/examples/diameter-of-binary-tree/) for a recursive helper that updates an outer accumulator.

## Branches

Branches use `if condition:`, `else if condition:`, and `else:`. Branch headers share an indentation level; each body is one level deeper.

Conditions follow the [truthiness rules](/docs/specification/types/#booleans-and-truthiness).

[Chained comparisons](/docs/specification/types/#chained-comparisons) such as `0 <= index < items.size` test adjacent pairs, evaluating each operand at most once and stopping at the first false comparison.

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

Ordinary `for` bindings and assignments inside loop bodies belong to the enclosing function or file, following [scope and initialization](/docs/specification/types/#scope-and-initialization). They remain visible after the loop. A loop that runs zero times does not assign its bindings or clear any earlier values. Comprehension and generator bindings have their own expression-local scopes.

For sets, `for value in values:` visits each distinct element in insertion order. See [set iteration](/docs/specification/collections/#set-iteration-and-order). Indexed and reverse set forms remain open.

For counters, `for key, count in counts:` binds each stored key and its integer count in insertion order. See [counter iteration](/docs/specification/collections/#iteration-and-order). Single-binding and indexed counter forms remain open.

For an [explicit iterator](/docs/specification/collections/#iterators), `for value in cursor:` consumes its remaining elements from the current position. Reusing the iterator continues from that position rather than restarting it. Exhaustion ends the loop normally; other errors propagate. A single binding or parenthesized tuple unpacking is supported; indexed and reverse forms remain open.

For maps, `for key, value in counts:` is a proposal. Single-binding and indexed forms, along with map iteration order, remain open.

Lists and strings can be traversed together using [`zip`](/docs/specification/collections/#parallel-iteration):

```birdie
for (c1, c2) in zip(s, t):
    freqs[c1 - 'a']++
    freqs[c2 - 'a']--
```

The sources must have equal lengths. The parentheses unpack a pair; `for c1, c2 in zip(s, t):` is not the pair-unpacking form.

### Counted repetition

`repeat count:` runs a block a fixed number of times without introducing an index binding:

```birdie
repeat pending.size:
    node = pending.pop()
    # Process this node and enqueue its children.
```

- The count must be an `int`; incompatible types are type errors. An optional integer follows [checked optional use](/docs/specification/types/#checked-optional-use).
- Evaluate the count once when entering the loop. Changing a variable or collection used in that expression does not change the active repetition count.
- Zero or negative counts run the body zero times, matching `for _ until count:`.
- Each completed iteration consumes one repetition. `continue` also consumes the current repetition before starting the next one; it does not reevaluate the count. `return` exits the enclosing function normally.
- The header introduces no bindings. Assignments in the body follow the ordinary [scope and initialization rules](/docs/specification/types/#scope-and-initialization), so a value assigned in the body can be read after the loop. If no assignment has executed, reading it raises a runtime error.
- This is a statement form. It cannot be used as an expression or a comprehension clause.

See [Binary Tree Level Order Traversal](/docs/examples/binary-tree-level-order-traversal/) for a queue whose size is captured at the start of each level.

See [Binary Tree Right Side View](/docs/examples/binary-tree-right-side-view/) for reading the last node assigned by a nonempty repetition after it finishes.

### Continue

`continue` is a standalone statement that skips the remainder of the current iteration of the nearest enclosing loop in the same function.

- A `for` loop advances to its next value. A `repeat` loop advances to its next repetition. A `while` loop reevaluates its condition.
- It does not restart the loop or repeat its initialization.
- Use outside a loop, including inside a helper called by a loop but with no loop of its own, is a compile-time error.
- Comprehensions contain expressions, so `continue` cannot appear inside them.

### Generator expressions

An expression followed by one or more `for` clauses describes a lazy traversal. Clauses reuse ordinary loop bindings and traversal forms, including ranges, counter key/count bindings, and `zip`. Bindings are local to the expression. The first use is the [`all` predicate check](/docs/specification/collections/#predicate-expressions-and-all):

```birdie
return all(value == 0 for value in freqs)
```

When a generator is the sole argument of a call, the call's parentheses also delimit the generator. Multiple clauses follow the nesting and scope rules below. The explicit `iterator[T]` API initially covers list and string cursors; assigning or returning generator expressions, their type syntax and escaping lifetimes, and comprehension filters remain open.

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
