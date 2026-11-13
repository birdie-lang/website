---
title: Syntax & execution
description: Source layout, file execution, functions, branches, loops, and ranges.
navTitle: Syntax & execution
section: specification
order: 0
---

This specification records the agreed language design. The other chapters cover [types and variables](/docs/specification/types/) and [collections](/docs/specification/collections/).

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

- Files can contain function definitions and top-level statements.
- Parse and type-check the whole file before executing anything.
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

For maps, `for key, value in counts:` is a proposal. Single-binding and counter forms, along with map iteration order, remain open.

### Ranges

- `start until end`: include the start, exclude the end.
- `start through end`: include both bounds.
- Bounds are integers. Forward iteration increases by `step`, defaulting to `1`.
- An explicit `step` must be a positive integer. Nonpositive steps are invalid.
- An inclusive end is visited only if the step lands on it.
- A start greater than the end produces an empty range. `until` is also empty when the bounds are equal.
- Range iteration does not materialize a list.

| Loop header | Values |
| --- | --- |
| `for i in 0 until 4:` | `0, 1, 2, 3` |
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

- Single-binding map iteration and counter + key + value syntax.
- Map iteration order and reverse iteration over maps.
- Mutation during collection iteration.
