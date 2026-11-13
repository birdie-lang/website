---
title: What comes next
description: Birdie’s implementation direction, from language design to a browser playground.
navTitle: What comes next
order: 4
---

Birdie is in the language-design stage. The repository currently contains proposed examples and initial decisions. There is no release or installation guide yet.

## First, a working language

The planned implementation is in Go. Its first milestones are:

1. Refine representative examples and the language specification.
2. Implement a lexer, parser, and AST.
3. Build a minimal AST interpreter.
4. Add collections and type checking sufficient to execute Two Sum end to end.
5. Expand the language as new examples reveal a concrete need.

Parsing, static analysis, runtime values, and execution will remain separate so the same core can serve a CLI, REPL, and browser.

## Then, a browser playground

The planned playground will run locally in the browser. The Go interpreter or eventual VM will be compiled to WebAssembly and run in a Web Worker.

The worker will keep execution off the UI thread. Execution budgets and memory/output protections will be needed for runaway programs. The [playground page](/play/) currently explains this future feature; it does not run code.

## Understand algorithmic work

A later cost model aims to report language-level work, including comparisons, collection operations, and allocations. The starting point will be a vector of operation counts, with explicitly defined costs for built-ins.

These counts will not automatically prove complexity or predict hardware performance. Repeatability across execution backends is a design goal that still needs implementation and validation.

## Later investigations

A bytecode compiler and VM are planned after the semantics stabilize. A language server and editor integration can share the parser and type checker. Native compilation is an optional investigation.

There are no release dates attached to these milestones. Follow the [language repository](https://github.com/birdie-lang/birdie) for the evolving design.
