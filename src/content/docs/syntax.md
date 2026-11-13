---
title: Syntax & types
description: Birdie’s rules for functions, types, variables, and control flow.
navTitle: Syntax & types
order: 1
---

## Functions and blocks

Declare a function with `fn`, explicit parameter types, and an optional return type after the closing parenthesis. A colon and indentation define its body.

```birdie
fn search(nums: list[int], target: int) int:
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
| `list[T]` | Growable list of elements of type `T` |
| `map[K, V]` | Map from keys of type `K` to values of type `V` |
| `stack[T]` | LIFO stack of elements of type `T` |
| `(A, B)` | Fixed pair with a type for each position |

Collection type names take their type arguments in brackets: `list[int]`, `map[str, int]`, or `stack[char]`. Types can nest, as in `list[list[str]]`.

`[]` and `[1, 2, 3]` are list literals. `list()` constructs an empty list; its element type is inferred from use. The [collections reference](/docs/collections/) covers constructors and operations in detail.

## Tuples and unpacking

`(A, B)` describes a fixed pair, and `list[(int, int)]` is a list of integer pairs. Use parentheses when unpacking: `(x, y) = point`.

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

`for i, (x, y) in points:` combines an index with tuple unpacking.

For maps, `for key, value in counts:` is proposed. Single-binding and counter forms, along with map iteration order, remain open questions.

## Conditions

Conditions accept booleans, lists, maps, and stacks. Empty collections are false; nonempty collections are true. Numbers require an explicit comparison, such as `count != 0`.

`not` returns a boolean. `or` evaluates left to right and short-circuits when the left operand is true.

## Integers and division

`int` does not have fixed-width overflow, but its size is limited by available resources. The cost of an operation depends on operand size. `int()` returns zero.

`//` is floor division: `7 // 2` is `3`, while `-7 // 2` is `-4`. Division by zero is a runtime error. `/` is reserved for fractional division; floating-point behavior remains undecided.

## Strings and characters

Strings are immutable. Indexed assignment to a string is a type error.

String iteration and indexing yield `char` values. String length and indices count Unicode scalar values, not bytes. A visible symbol may contain more than one scalar value. String equality and hashing use the scalar sequence as stored.

`s.sorted()` returns a new string with its characters sorted by Unicode scalar value. It leaves the original unchanged and uses no locale-dependent ordering.

```birdie
word = "tea"
key = word.sorted()  # "aet"; word is still "tea"
```

An empty or multi-scalar character literal is an error. Conversion and concatenation between `char` and `str` are still open questions.
