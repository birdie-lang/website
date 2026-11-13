---
title: Introduction
description: Birdie’s syntax, types, and implementation plans.
navTitle: Start here
order: 0
---

Birdie is a statically typed programming language for coding challenges and interview problems.

The syntax borrows from Python, with built-in collections such as maps and stacks.

> **Language status**
>
> Birdie is in the design stage. This handbook describes the current language specification; the interpreter and browser playground are not available yet.

## Two Sum in Birdie

A Two Sum solution looks like this:

```birdie title="two-sum.bd"
fn twoSum(nums: list[int], target: int) list[int]:
    seen = map()

    for i, num in nums:
        diff = target - num

        if diff in seen:
            return [seen[diff], i]

        seen[num] = i

    return []
```

Function parameters have explicit types. The types of local variables and the map are inferred from their use. Indentation defines the blocks.

## In this handbook

- [Syntax & types](/docs/syntax/): functions, variables, loops, and type rules.
- [Collections](/docs/collections/): lists, map defaults and factories, and dedicated stacks.
- [Examples](/docs/examples/): four algorithms, compared with Python.
- [Implementation plan](/docs/roadmap/): the interpreter and future playground.

## Source

The [Birdie repository](https://github.com/birdie-lang/birdie) contains the language design and examples. The implementation will begin with an AST interpreter in Go.
