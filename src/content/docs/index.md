---
title: Meet Birdie
description: A small, experimental language for expressing algorithms clearly.
navTitle: Start here
order: 0
---

Birdie is an experimental programming language for algorithmic problem solving: coding challenges, interviews, and working through an idea.

It takes inspiration from Python’s readable syntax, with static typing and first-class algorithmic data structures. The goal is to make a solution easier to read and reason about.

> **Early development**
>
> The syntax in this handbook is proposed and is not yet implemented. Birdie is not ready for general use, and there is no runnable browser playground yet.

## Start with a problem

Here is the proposed solution to Two Sum:

```birdie title="two-sum.bd"
fn twoSum(nums: [int], target: int) [int]:
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
- [Collections](/docs/collections/): lists, maps, and dedicated stacks.
- [Examples](/docs/examples/): three familiar algorithms, with explanations.
- [What comes next](/docs/roadmap/): the implementation direction and future playground.

## Follow the language

The [Birdie repository](https://github.com/birdie-lang/birdie) contains the evolving design and proposed examples. The implementation is planned in Go, beginning with an AST interpreter.
