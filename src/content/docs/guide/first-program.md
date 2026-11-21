---
title: Your first program
description: Birdie source files, functions, indentation, and top-level statements.
navTitle: First program
section: guide
order: 1
---

This example introduces draft function syntax and file execution.

## A small program

Birdie source files use the `.bd` extension.

```birdie title="add.bd"
fn add(a: int, b: int) int:
    return a + b

result = add(3, 4)
```

`fn` defines a function. Each parameter has a name and type separated by a colon. The `int` after `)` is the return type. It can be omitted when the function body makes it unambiguous.

`result` needs no annotation: `add` returns an integer, so Birdie infers its type as `int`. Its value would be `7`.

## Blocks and comments

A colon starts a block. Its body uses exactly four more spaces than the header. Tabs in indentation are errors.

Use `#` for comments:

```birdie
# Count the items processed so far.
count = 0
count++  # Increase by one.
```

## File execution

Function definitions and statements can share a file. The whole file is parsed and type-checked before execution. Top-level statements run in source order, and function bodies run when called.

No `main` function is required. The assignment to `result` above is a top-level statement.

Continue with [language basics](/docs/guide/basics/). The [syntax specification](/docs/specification/) records the exact layout and execution rules.
