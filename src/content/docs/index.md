---
title: Introduction
description: Learn Birdie and find the draft language specification.
navTitle: Introduction
section: guide
order: 0
---

Birdie is an experimental programming language for coding challenges and interview problems.

The code should make the algorithm easy to read, explain, and write. The design uses static types and inference to describe data and catch incompatible operations. Value-dependent assumptions such as bounds and optional presence can be checked at runtime.

The syntax borrows from Python, with built-in collections such as maps and stacks.

The [philosophy](/docs/philosophy/) explains why Birdie exists and how we choose between language designs.

> **Language status**
>
> Birdie is in early development. The REPL supports basic expressions and variables. The guide and specification also cover planned features.

## Guide

Start with [your first program](/docs/guide/first-program/), then learn the [language basics](/docs/guide/basics/): variables, collections, conditions, and loops.

The [algorithm examples](/docs/examples/) show complete solutions alongside Python versions.

## Specification

The specification records the current design. Unresolved behavior is listed as an open question.

- [Syntax & execution](/docs/specification/) covers indentation, functions, branches, loops, and ranges.
- [Types & variables](/docs/specification/types/) covers inference, assignment, and tuples, with links to records, optional values, and operators.
- [Collections](/docs/specification/collections/) covers shared rules and links to the individual collection and iterator APIs.

These pages are the authoritative language specification. The guide explains the same design through examples.

## Implementation

The Go interpreter and example programs live in the [Birdie repository](https://github.com/birdie-lang/birdie). See the [roadmap](/docs/roadmap/) for implemented and planned features.
