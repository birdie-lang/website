---
title: Syntax & types
description: Birdie’s proposed rules for functions, types, variables, and control flow.
navTitle: Syntax & types
order: 1
---

> **Proposed syntax**
>
> These are design decisions, not a description of a working implementation. Some behavior is still unresolved.

## Functions and blocks

Declare a function with `fn`, explicit parameter types, and an optional return type after the closing parenthesis. A colon and indentation define its body.

```birdie
fn search(nums: [int], target: int) int:
    left = 0
    right = nums.size - 1
```

There is no arrow before the return type. Birdie aims to infer return types when they are unambiguous.

## Static types, local inference

Birdie is designed to be statically typed. It infers local variable types, collection types, and generic arguments where practical. Ambiguous types should produce a diagnostic rather than silently become dynamic values.

The initial design includes:

| Type | Meaning |
| --- | --- |
| `int` | Signed, arbitrary-precision integer |
| `bool` | `true` or `false` |
| `str` | String, written with double quotes |
| `char` | One Unicode scalar value, written with single quotes |
| `[T]` | Growable list of elements of type `T` |
| `(A, B)` | Fixed pair with a type for each position |

## Variables

`=` introduces a variable if the name is new, or reassigns an existing variable. Reassignment must remain compatible with the inferred type.

Variables require an initial value. Every read must have an assignment on every execution path that reaches it. Assignment inside a block updates an existing enclosing local variable.

Whether a variable first introduced in a block is visible outside that block is still an open question.

## Loops

A single binding yields values. Two bindings yield the zero-based index and value.

```birdie
for num in nums:
    seen[num] = true

for i, num in nums:
    seen[num] = i
```

`while` tests the condition before each iteration. Parenthesized bindings unpack a tuple, as in `for (x, y) in points:`.

## Conditions

Conditions accept booleans, lists, maps, and stacks. Empty collections are false; nonempty collections are true. Numbers require an explicit comparison, such as `count != 0`.

`not` returns a boolean. `or` evaluates left to right and short-circuits when the left operand is true.

## Integers and division

`int` does not have fixed-width overflow, but its size is limited by available resources. The cost of an operation depends on operand size.

`//` is floor division: `7 // 2` is `3`, while `-7 // 2` is `-4`. Division by zero is a runtime error. `/` is reserved for fractional division; floating-point behavior remains undecided.

## Strings and characters

String iteration yields `char` values. String length and indices count Unicode scalar values, not bytes. A visible symbol may contain more than one scalar value.

An empty or multi-scalar character literal is an error. Conversion and concatenation between `char` and `str` are still open questions.
