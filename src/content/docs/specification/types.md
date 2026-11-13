---
title: Types & variables
description: Static inference, assignment, integers, truthiness, strings, and tuples.
navTitle: Types & variables
section: specification
order: 1
---

## Types

| Type | Meaning |
| --- | --- |
| `int` | Signed, arbitrary-precision integer |
| `bool` | `true` or `false` |
| `str` | Immutable string, written with double quotes |
| `char` | One Unicode scalar value, written with single quotes |
| `list[T]` | Growable list of elements of type `T` |
| `map[K, V]` | Map from keys of type `K` to values of type `V` |
| `stack[T]` | LIFO stack of elements of type `T` |
| `(A, B)` | Fixed pair with a type for each position |

Collection type arguments use brackets and can nest: `list[int]`, `map[str, int]`, `stack[char]`, and `list[list[str]]`.

## Inference

- Birdie is statically typed.
- Infer local variables, return types, and collection type arguments from usage.
- Infer locals from later uses within the same function or top-level script body.
- Check independently defined functions without inferring their types from callers.
- Function parameter types are explicit. Return annotations are optional when the body determines the type unambiguously.
- Require an annotation when inference is ambiguous. Do not fall back to a dynamic type.
- Conflicting constraints are type errors. An annotation does not resolve incompatible uses.
- The four current [algorithm examples](/docs/examples/) must require no local type annotations.

An initially empty collection can get its type from a later operation:

```birdie
seen = map()
seen["bird"] = 1
```

This constrains `seen` to `map[str, int]`. A function that only returns `map()` provides insufficient information; an explicit return type such as `map[str, int]` can resolve it.

## Variables

- `=` introduces a variable when the name is not already defined; otherwise it reassigns it.
- Optional explicit annotation: `name: Type = value`.
- Reassignments must be compatible with the variable's inferred type.
- Local variables require an initial value. There is no declaration-only form.
- Every read requires an assignment on every execution path reaching it.
- Assignment inside a block updates an existing enclosing local variable.

### Increment and decrement

- `target++` and `target--` are standalone statements with no result value.
- The target must be a writable integer location, such as a variable or map entry.
- Add or subtract one.
- Prefix forms and use inside expressions are not supported.

## Integers and division

- `int` is signed and arbitrary precision, with no fixed bit width or wrapping overflow.
- `int()` returns zero.
- Value size is limited by available resources. Operation costs depend on operand size.
- `//` is floor division. Integer operands produce an integer.
- Floor rounds toward negative infinity: `7 // 2` is `3`; `-7 // 2` is `-4`.
- `/` is reserved for fractional division.
- Division by zero causes a runtime error.

## Booleans and truthiness

- `bool` values are `true` and `false`.
- Conditions and `not` accept booleans, lists, maps, and stacks.
- Empty collections are false; nonempty collections are true.
- `not` returns a boolean. `not opened` tests whether a stack is empty.
- Numbers require explicit comparisons, such as `count != 0`.
- `or` evaluates left to right and short-circuits when its left operand is true.

## Strings and characters

- `str` literals use double quotes: `"text"`, `"a"`.
- Strings are immutable. Indexed assignment is a type error.
- String equality and hashing use the Unicode scalar sequence as stored.
- `char` is one Unicode scalar value, written with single quotes: `'a'`.
- Empty or multi-scalar character literals are errors: `''`, `'ab'`.
- A visible symbol can contain multiple Unicode scalar values.
- String iteration and indexing yield `char` values.
- String size and indices count Unicode scalar values, not bytes.
- `s.sorted()` returns a new `str` with characters sorted by Unicode scalar value, without locale-dependent ordering or mutation of the original string.

### Escapes

Supported escapes: `\n`, `\t`, `\r`, `\\`, `\'`, `\"`.

Escapes count as their resulting characters; `'\n'` is one `char`. Unknown escapes are syntax errors. Quoted literals cannot span source lines.

## Tuples

- `(A, B)` is a fixed pair with a type for each position.
- `list[(int, int)]` is a list of integer pairs.
- Tuple unpacking requires parentheses: `(x, y) = point`.
- [Loop bindings](/docs/specification/#loops) use the same parenthesized unpacking form.

## Open questions

- Visibility outside a block of variables first introduced inside it.
- Floating-point arithmetic.
- Remainder semantics and explicit truncating division.
- Conversion and concatenation between `char` and `str`.
