---
title: Types & variables
description: Birdie’s type system, inference, assignment, and scope.
navTitle: Types & variables
section: specification
order: 1
---

See [records and optional values](/docs/specification/records-and-optionals) for user-defined types and values that can be absent, or [built-in values and operators](/docs/specification/values-and-operators) for numeric, boolean, and text operations.

## Types

| Type | Meaning |
| --- | --- |
| `int` | Finite, signed, arbitrary-precision integer |
| `number` | An `int`, negative infinity, or positive infinity |
| `bool` | `true` or `false` |
| `str` | Immutable string, written with double quotes |
| `char` | One Unicode scalar value, written with single quotes |
| `list[T]` | Growable list of elements of type `T` |
| `map[K, V]` | Map from keys of type `K` to values of type `V` |
| `counter[T]` | Keys of type `T` with signed integer counts; zero counts are omitted |
| `set[T]` | Mutable collection of distinct values of type `T` |
| `stack[T]` | LIFO stack of elements of type `T` |
| `queue[T]` | FIFO queue of elements of type `T` |
| `iterator[T]` | Shared, single-pass cursor yielding elements of type `T` |
| `(A, B)` | Fixed pair with a type for each position |
| `T?` | A value of type `T` or `none` |

Collection and iterator type arguments use brackets and can nest: `list[int]`, `map[str, int]`, `counter[char]`, `set[int]`, `stack[char]`, `queue[TreeNode]`, `iterator[str]`, and `list[list[str]]`.

Types describe the algorithm's data and valid operations. Birdie checks incompatible types statically, while value-dependent requirements such as index bounds and the presence of an optional value can be checked at runtime. Operation signatures describe present values; [checked optional use](/docs/specification/records-and-optionals#checked-optional-use) applies when the underlying type is compatible.

## Inference

- Birdie is statically typed.
- Infer local variables, return types, and collection type arguments from usage.
- Infer locals from later uses within the same function or top-level script body.
- Check independently defined functions without inferring their types from callers.
- Function parameter types are explicit. Return annotations are optional when the body determines the type unambiguously. A function with no result annotation and no value-returning statements is a [procedure](/docs/specification#procedures); its calls produce no value, rather than `none`.
- Require an annotation when inference is ambiguous. Do not fall back to a dynamic type.
- Conflicting underlying type constraints are type errors. An annotation does not resolve incompatible uses. Integers and `number` values have the common numeric type `number`; an initializer or direct assignment containing infinity contributes that wider type. Nullable-to-present and `number`-to-`int` uses follow their runtime checks rather than requiring a proof of presence or finiteness.
- The current [algorithm examples](/docs/examples) must require no local type annotations.

An initially empty collection can get its type from a later operation:

```birdie
seen = map()
seen["bird"] = 1
```

This constrains `seen` to `map[str, int]`. A function that only returns `map()` provides insufficient information; an explicit return type such as `map[str, int]` can resolve it.

## Variables

- Within a function, `=` introduces or updates that function's local binding, unless the name appears as `outer name` in its header. It never implicitly rebinds an enclosing function's variable.
- At the top level, `=` introduces a variable when the name is not already defined; otherwise it reassigns it.
- Optional explicit annotation: `name: Type = value`.
- Reassignments must be compatible with the variable's inferred type.
- Assignment syntax requires an initializer expression. There is no declaration-only form.
- Ordinary branches and loops do not introduce a variable scope. A name first assigned inside one belongs to the enclosing function, or to the file for top-level code, and is visible outside that block.
- Reads check initialization at runtime when it is not already known. A path that reaches a read without assigning that binding raises a runtime error; a static proof of assignment on every path is not required.
- Assignment inside a branch or loop creates or updates the same function-local binding. Rebinding an enclosing function's variable requires an `outer` capture in the nested function's header.

### Scope and initialization

Names resolve lexically from the source's enclosing scopes. A function cannot read a caller's locals merely because that caller invokes it. Scope, static type, and runtime initialization are separate properties of a binding.

```birdie
fn chosenValue(ready: bool) int:
    if ready:
        value = 3

    return value + 1
```

`value` is a function-local `int`. `chosenValue(true)` returns `4`; `chosenValue(false)` raises an initialization error when reading `value`, before performing the addition. Both calls use the same statically checked function body.

- Determine local names from assignments and ordinary `for` bindings across the whole function body, including branches and loops, excluding names captured with `outer` in its header. Nested function and comprehension bindings belong to their own scopes. Types follow the ordinary inference rules; all assignments must fit a binding's inferred or declared type, even when conditional. Uninitialized state does not widen that type or introduce `any`.
- A local binding exists throughout its function body, including before its first assignment. A read before an executed assignment raises a runtime error instead of falling back to an enclosing variable of the same name. A name with no binding in any applicable lexical scope is a compile-time error.
- Each function call starts with initialized parameters and uninitialized ordinary locals. Executing an assignment initializes or updates its target after evaluating the right-hand side. The declaration syntax still requires an initializer; there is no declaration-only form.
- An uninitialized binding is an internal runtime state, distinct from every language value, including `none`, `0`, and `false`. Reading it, even in `value == none`, fails. No default value is supplied.
- Branches and loop iterations share the enclosing function's bindings. Skipping an assignment or executing a loop zero times leaves an existing value unchanged; a binding that has never received a value stays uninitialized.
- Ordinary `for` bindings follow the same assignment rules and are visible after the loop. Comprehension and generator bindings remain local to their expressions, as specified separately.
- Captures retain lexical bindings and use the same initialization checks. Registering a nested helper does not initialize its captured locals. Calling it before a captured value is assigned fails if that value is read; calling it after assignment observes the stored value.
- Compound assignments, increments, and in-place operations read their targets using the same rules. They cannot initialize an uninitialized binding by reading a default value.

See [Binary Tree Right Side View](/docs/examples/binary-tree-right-side-view) for using the last node assigned inside `repeat` after that loop finishes.

### Outer variables

An `outer name` entry in a nested function's header lets it rebind a variable from the nearest enclosing function scope that defines it.

```birdie
fn dfs(node: TreeNode?, outer diameter) int:
```

For this header, calls pass only the node, as in `dfs(root)`. The enclosing `diameter` binding is captured automatically.

- Put ordinary parameters first, followed by one `outer name` entry per writable capture: `fn update(value: int, outer total, outer count) int:`. A function with no ordinary parameters can use a header such as `fn next(outer count) int:` and is called as `next()`.
- Capture entries do not affect the function's argument count or callable type. Their types come from the enclosing bindings and have no separate annotations or default values. `outer` is allowed only in nested function headers, not as a body statement.
- The name must resolve to a variable binding in an enclosing function scope. A missing binding, a top-level-only binding, or `outer` on a top-level function is a compile-time error. Resolving a capture does not read or initialize its binding; a later read before assignment fails at runtime.
- Duplicate captures are errors. A captured name cannot also be an ordinary parameter or a separately declared local in that function. Its scope applies throughout the function body.
- Reads and writes use the same enclosing binding. Its inferred or declared type stays unchanged, and reads use the runtime initialization checks above. Ordinary assignment through `outer` can initialize the enclosing binding.
- Bare-name writes using assignment, `for` bindings, compound assignment, tuple unpacking, increment/decrement, `swap!`, `min!`, and `max!` all follow this rule.
- Without `outer`, an assignment introduces or updates a local binding even when an enclosing function has a variable with the same name. Reading the new local before initialization is a runtime error; `diameter = max(diameter, candidate)` cannot implicitly read the outer `diameter`.
- Reading an enclosing variable, or mutating a field or collection through its reference, needs no `outer` entry because it does not rebind that name.

This keeps recursive helper locals separate while allowing an explicitly shared accumulator. See [Diameter of Binary Tree](/docs/examples/diameter-of-binary-tree).

### Compound assignment

`target += value`, `target -= value`, `target *= value`, and `target //= value` apply an arithmetic operation and store its result back in the target. They are standalone statements with no result value.

```birdie
total += num
remaining -= 1
prod *= num
res[i] *= prod
quotient //= divisor
```

- The target must be an initialized writable location, such as a local variable, record field, list element, map entry, or counter entry. Compound assignment does not initialize a new variable.
- Resolve the target location once, including its receiver and index expressions, and read its existing value. Then evaluate the right-hand side once, apply the operation, and store the result at that same location.
- Follow the corresponding binary operator and ordinary assignment type rules. Targets can have type `int` or `number`. `+=`, `-=`, and `*=` use the numeric arithmetic rules below; `//=` requires finite integer operands. A result written to an `int` target must be finite. These operations do not introduce collection repetition, string concatenation, or implicit character conversions.
- Read locations using their normal rules. Invalid list indices fail; a missing ordinary map entry fails; a map with a default can insert that default; a missing counter entry reads as zero without insertion.
- Apply normal write behavior, including removing a counter key when its resulting count is zero.
- `//=` uses floor division, including for negative operands. A zero divisor causes a runtime error and does not write a quotient.
- Errors do not undo side effects from target evaluation, reading a map default, or evaluating the right-hand side.
- Reading an uninitialized target fails at runtime before evaluating the right-hand side. Undefined names, nonwritable targets, incompatible types, and use inside an expression are compile-time errors. Rebinding an enclosing function's variable still requires an `outer` capture in the function header.

See [Product of Array Except Self](/docs/examples/product-of-array-except-self) for multiplication assignments in two indexed passes.

### Increment and decrement

- `target++` and `target--` are standalone statements with no result value.
- The target must be an initialized writable location of type `int` or `number`, such as a variable or map entry.
- Add or subtract one using the corresponding numeric compound-assignment rules. An infinity stored in a `number` target stays the same infinity.
- Prefix forms and use inside expressions are not supported.

### In-place operations

`swap!`, `min!`, and `max!` are built-in in-place operations. They use parentheses to group their arguments and are standalone statements with no result value.

- The `!` is part of each built-in spelling and immediately follows its name. Parentheses are required.
- Writable arguments identify initialized locations, such as variables, record fields, list elements, map entries, or counter entries. Temporary values are not writable arguments.
- These forms receive the specified writable arguments as locations. Ordinary function calls retain their existing argument-passing behavior.
- The complete spellings are reserved built-in forms, independent of name lookup for `min` or `max`. They cannot be stored or passed as function values, and cannot appear inside expressions.
- User-defined function names with `!` and general writable parameters remain outside this draft. The suffix does not mark every side effect; existing methods such as `push`, `pop`, and `add` keep their names.

### Swap

`swap!(a, b)` exchanges the values at two writable locations.

```birdie
swap!(left, right)
swap!(root.left, root.right)
swap!(nums[i], nums[j])
```

- Exactly two targets are required. Variables must already be initialized; fields and collection entries must be writable.
- Resolve the target locations once, from left to right, and capture both values before writing either replacement. Calls and index expressions in targets are not repeated.
- Each incoming value must fit the other target's type. Incompatible types and nonwritable targets are type errors.
- Exchange the values using their usual assignment semantics. Swapping record references does not copy or allocate nodes.
- Swapping a location with itself leaves its value unchanged.
- Reading an invalid index or a missing map entry follows the normal collection rules. A map with a configured default can insert that default when the entry is read.

Tuple assignment remains available; `swap!` provides a concise form for an exchange. See [tuple unpacking](#tuples) for the more general assignment form.

### Minimum and maximum updates

`max!(target, candidate)` keeps the larger numeric value in the target. `min!(target, candidate)` keeps the smaller.

```birdie
max!(longestSeq, currSeq)
max!(diameter, left + right)
min!(distances[node], candidate)
```

- Exactly two operands are required. The first must be an initialized writable location of type `int` or `number`; the second must produce an `int` or `number`.
- Resolve the target location once and read its current value, then evaluate the candidate once. Use the same location-evaluation and scope rules as compound assignment.
- Write the candidate only when it is strictly larger for `max` or strictly smaller for `min`. Equal values leave the target unchanged, with no final write.
- Keep the target's inferred or declared type. If an improving candidate is infinite and the target has type `int`, the finite-value check fails before writing; a non-improving candidate requires no write. A `number` target can store either integers or infinities.
- Reads use normal location rules, including map-default insertion and nonmutating zero reads from counters. Writes use normal assignment behavior, including counter zero removal.
- A read or candidate evaluation can have its ordinary side effects even when the candidate does not improve the target. Errors do not roll those effects back.
- Reading an uninitialized target fails at runtime before evaluating the candidate. Undefined names, nonwritable targets, incompatible operand types, and use inside an expression are compile-time errors. Rebinding an enclosing function's variable requires an `outer` capture in the function header.

`max(a, b)` and `min(a, b)` remain ordinary value-returning function calls. Only the first argument of `max!` or `min!` is a writable argument; the candidate is evaluated as an ordinary value.

See [Longest Consecutive Sequence](/docs/examples/longest-consecutive-sequence) for a running maximum update.

## Tuples

- `(A, B)` is a fixed pair with a type for each position.
- `list[(int, int)]` is a list of integer pairs.
- Tuple unpacking requires parentheses: `(x, y) = point`.
- Targets can be variables, writable fields, or collection entries. Each incoming value must fit its destination type.
- Evaluate the entire right-hand side before assigning any target, so an exchange preserves both original values:

```birdie
(root.left, root.right) = (root.right, root.left)
```

- Assign unpacked values to targets from left to right, evaluating each target location once when it is assigned. Repeated targets receive the last assigned value.
- Unpacking requires the tuple and target shapes to match; mismatches are type errors.
- [Loop bindings](/docs/specification#loops) use the same parenthesized unpacking form.
