---
title: Introduction
description: Learn Birdie and find the draft language specification.
navTitle: Introduction
section: guide
order: 0
---

Birdie is a statically typed programming language for coding challenges and interview problems.

The syntax borrows from Python, with built-in collections such as maps and stacks.

> **Language status**
>
> Birdie is in the design stage. The docs describe proposed syntax and behavior. The interpreter and browser playground are not available yet.

## Guide

Start with [your first program](/docs/guide/first-program/), then learn the [language basics](/docs/guide/basics/): variables, collections, conditions, and loops.

The [algorithm examples](/docs/examples/) show complete solutions alongside Python versions.

## Draft specification

The specification records the current design. Unresolved behavior is listed as an open question.

- [Syntax & execution](/docs/specification/): indentation, functions, branches, loops, and ranges.
- [Types & variables](/docs/specification/types/): inference, assignment, integers, strings, and tuples.
- [Collections](/docs/specification/collections/): list, map, and stack APIs, including defaults and copy behavior.

These pages are the authoritative language specification. The guide explains the same design through examples.

## Implementation

The [Birdie repository](https://github.com/birdie-lang/birdie) holds the example programs and will contain the Go implementation. See the [implementation plan](/docs/roadmap/) for its milestones.
