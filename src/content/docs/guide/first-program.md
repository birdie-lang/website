---
title: Your first program
description: Birdie source files, functions, indentation, and top-level statements.
navTitle: First program
section: guide
order: 1
---

Paste this program into the [playground](/playground) and select **Run**. The result is `7`.

## A small program

Birdie source files use the `.bd` extension.

```birdie title="add.bd"
fn add(a: int, b: int) int:
    return a + b

add(3, 4)
```

`fn` defines a function. Each parameter has a name and type separated by a colon. The `int` after `)` is the declared return type. The last line calls `add` with `3` and `4`.

## Blocks and comments

A colon starts a block. Its body uses exactly four more spaces than the header. Tabs in indentation are errors.

The language design uses `#` for comments. Comment support is still planned for the interpreter.

```birdie
# Count the items processed so far.
count = 0
count++  # Increase by one.
```

## Running a program

The playground parses the whole editor before evaluating it. Top-level statements run in source order, and function bodies run when called. No `main` function is required.

The command-line tool provides an interactive REPL. Running `.bd` files from the command line and static type checking are on the [roadmap](/docs/roadmap).

Continue with [language basics](/docs/guide/basics). The [syntax specification](/docs/specification) records the exact layout and execution rules.
