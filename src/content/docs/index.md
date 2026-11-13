---
title: Meet Birdie
description: A small language for expressing algorithms clearly.
navTitle: Start here
order: 0
---

Birdie is a programming language for algorithmic problem solving: coding challenges, interviews, and working through an idea.

It takes inspiration from Python’s readable syntax, with static typing and first-class algorithmic data structures. The goal is to make a solution easier to read and reason about.

> **Language status**
>
> Birdie is in the design stage. This handbook describes the current language specification; the interpreter and browser playground are not available yet.

## Start with a problem

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

## Find your way around

- [Syntax & types](/docs/syntax/): functions, variables, loops, and the first type rules.
- [Collections](/docs/collections/): lists, map defaults and factories, and dedicated stacks.
- [Examples](/docs/examples/): four familiar algorithms, compared with Python.
- [What comes next](/docs/roadmap/): the implementation direction and future playground.

## Follow the language

The [Birdie repository](https://github.com/birdie-lang/birdie) contains the language design and examples. The implementation will begin with an AST interpreter in Go.
