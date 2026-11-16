---
title: Types & variables
description: Static inference, records, optional values, assignment, swapping, and built-in types.
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
| `counter[T]` | Keys of type `T` with signed integer counts; zero counts are omitted |
| `set[T]` | Mutable collection of distinct values of type `T` |
| `stack[T]` | LIFO stack of elements of type `T` |
| `queue[T]` | FIFO queue of elements of type `T` |
| `(A, B)` | Fixed pair with a type for each position |
| `T?` | A value of type `T` or `none` |

Collection type arguments use brackets and can nest: `list[int]`, `map[str, int]`, `counter[char]`, `set[int]`, `stack[char]`, `queue[TreeNode]`, and `list[list[str]]`.

Types describe the algorithm's data and valid operations. Birdie checks incompatible types statically, while value-dependent requirements such as index bounds and the presence of an optional value can be checked at runtime. Operation signatures describe present values; [checked optional use](#checked-optional-use) applies when the underlying type is compatible.

## Record types

Declare a record with `type` and explicitly typed fields. Recursive fields can refer to the record being declared:

```birdie
type TreeNode:
    val: int
    left: TreeNode? = none
    right: TreeNode? = none
```

- Records need no imports, decorators, or handwritten constructors.
- The generated constructor accepts field values in declaration order. Trailing fields with defaults can be omitted.
- A field without a default is required, including an optional field without a default.
- A default expression is evaluated for each construction when that field is omitted. Mutable defaults are not shared between constructions.
- Fields are writable. Assignments must match the declared field type; unknown fields and missing required constructor arguments are type errors.
- Records have reference semantics: assignment, argument passing, and returns share the same record rather than copying its fields.
- Changing a field is visible through every reference to that record. Reassigning a local variable does not rebind the caller's variable.

```birdie
root = TreeNode(4)
root.left = TreeNode(2)
alias = root
alias.right = TreeNode(7)
```

Here, `root` and `alias` refer to the same node. Both observe its updated right child.

## Optional values

- `T?` permits a value of type `T` or the lowercase literal `none`.
- A `T` value can be used where `T?` is expected. Nonoptional storage and parameters require present values; a checked use of `T?` either supplies its `T` value or fails before storing or passing `none`.
- Optionality does not supply a default: write `= none` explicitly when a field should default to absence.
- Check absence with `value == none` and presence with `value != none`. These comparisons return a `bool` by inspecting presence, without invoking payload equality or reference-identity comparison. They are available for every `T?`, even when equality for `T` is undefined.
- The draft uses only `==` and `!=` for these tests, without separate comparison aliases.
- The optional value can be on either side of the comparison. Evaluate operands once, from left to right. A successful presence proof narrows that local binding; general record equality and identity remain undecided.
- Field access through `TreeNode?` checks that the record is present at runtime when presence has not already been established. Unknown fields are still type errors.
- A presence check narrows a local variable to `T` on paths where it cannot be `none`. An early return preserves that knowledge for the remaining body.
- Reassignment updates the proof of presence; assigning a possibly absent value removes the narrowing.
- Narrowing a local record reference does not narrow its optional fields or assume those fields stay unchanged across calls.
- A call that can reassign a captured binding through `outer` invalidates its previous narrowing. Later uses follow the checked-use rules again.
- Conditions never interpret optionality as presence. Records have no truthiness, so use `root == none` or `root != none` rather than `if not root` or `if root`. An optional boolean or collection follows its underlying truth test after a presence check; an absent operand fails at runtime.

```birdie
fn nodeValue(root: TreeNode?) int:
    if root == none:
        return 0

    return root.val
```

After the early return, `root` is known to be a `TreeNode`. Its `left` and `right` fields still have type `TreeNode?`.

The presence form narrows inside the guarded branch:

```birdie
if root != none:
    value = root.val
```

### Checked optional use

When an operation requires `T` and receives `T?`, it checks for a present value without requiring explicit assertion or unwrapping syntax. A present value is used with its ordinary semantics; `none` causes a runtime error at that use site.

```birdie
fn requiredValue(node: TreeNode?) int:
    return node.val
```

Calling `requiredValue(none)` fails at the field access. In contrast, the `nodeValue` example above deliberately returns zero for an empty node. The guard expresses algorithmic behavior rather than satisfying a mandatory proof requirement.

- Checked use applies to member access, indexing, traversal, ordinary operators, and typed arguments, assignments, and return values that require a present value. The underlying type must support the operation; a `str?` cannot be used as an integer, and an unknown member remains a type error.
- Evaluate the optional expression once and check its presence before continuing the operation. Operands and arguments follow their normal left-to-right order. A failed check prevents later evaluation, the call, or the destination write; earlier effects are not rolled back.
- Checking presence does not clone or modify the value. Records and collections retain their reference-sharing behavior. Zero, `false`, and empty collections are present values and pass the check unchanged.
- `== none` and `!= none` inspect absence directly, without requiring a present payload. General record equality remains undecided.
- Inference preserves optionality. Reading an optional field into a local infers `T?`; later checked uses do not silently change that inferred type. An inferred function result can likewise remain optional even when a caller requires a present result.
- Explicit guards still narrow local types and can establish that a later presence check is unnecessary. Possible absence alone is not a compile-time rejection or a requirement to add suppression syntax. Tooling can display the inferred optional types.
- A missing value is never silently converted to zero, `false`, an empty collection, or another fallback. Checked use also does not return `none` from the current function; that behavior requires explicit control flow or postfix `?`.

See [Lowest Common Ancestor of a Binary Search Tree](/docs/examples/lowest-common-ancestor-of-a-binary-search-tree/) for passing optional child references to a function requiring a present node. The BST input guarantees justify that algorithmic assumption; violating it causes a runtime error.

### Optional propagation

Postfix `expression?` evaluates a `T?` expression once. A present value produces a `T`; an absent value immediately returns `none` from the nearest enclosing function.

```birdie
left = height(node.left)?
```

This has the same control flow as:

```birdie
left = height(node.left)
if left == none:
    return none
```

- The operand must have an optional type. A successful propagation expression has the underlying nonoptional type, so `left` above is inferred as `int` when `height` returns `int?`.
- The enclosing function must have an optional result type. Propagation contributes a possible `return none` during return-type inference; an explicit nonoptional return annotation is a type error. The operand's underlying type need not match the enclosing function's result type, because only `none` propagates.
- An absent operand abandons the current expression, statement, and remaining function body. Later operands and calls are not evaluated. Earlier side effects are not rolled back.
- Propagation returns from the function containing the expression. Inside a nested helper, it returns from that helper rather than its caller or an enclosing function.
- `?` is postfix and binds more tightly than arithmetic and comparisons. In a type annotation, `T?` keeps its existing optional-type meaning.
- The initial form applies to eagerly evaluated function-body expressions. Top-level propagation is a type error; propagation inside deferred generator expressions or field defaults remains open.

See [Balanced Binary Tree](/docs/examples/balanced-binary-tree/) for propagating an absent height. Its empty-node guard still returns zero: an absent node is a valid empty subtree, while an absent height signals imbalance.

## Inference

- Birdie is statically typed.
- Infer local variables, return types, and collection type arguments from usage.
- Infer locals from later uses within the same function or top-level script body.
- Check independently defined functions without inferring their types from callers.
- Function parameter types are explicit. Return annotations are optional when the body determines the type unambiguously.
- Require an annotation when inference is ambiguous. Do not fall back to a dynamic type.
- Conflicting underlying type constraints are type errors. An annotation does not resolve incompatible uses. Nullable-to-present uses follow the runtime checks above rather than requiring a proof of presence.
- The current [algorithm examples](/docs/examples/) must require no local type annotations.

An initially empty collection can get its type from a later operation:

```birdie
seen = map()
seen["bird"] = 1
```

This constrains `seen` to `map[str, int]`. A function that only returns `map()` provides insufficient information; an explicit return type such as `map[str, int]` can resolve it.

## Variables

- Within a function, `=` introduces or updates that function's local binding, unless the name is declared `outer`. It never implicitly rebinds an enclosing function's variable.
- At the top level, `=` introduces a variable when the name is not already defined; otherwise it reassigns it.
- Optional explicit annotation: `name: Type = value`.
- Reassignments must be compatible with the variable's inferred type.
- Local variables require an initial value. There is no declaration-only form.
- Every read requires an assignment on every execution path reaching it.
- Assignment inside a branch or loop updates an existing enclosing local in the same function. Crossing a function boundary requires `outer`.

### Outer variables

`outer name` lets a nested function rebind a variable from the nearest enclosing function scope that defines it. It is a scope declaration, with no runtime result value.

```birdie
outer diameter
```

- Write one name per declaration, at the start of the nested function body before using or assigning that name. The declaration applies throughout that function body.
- The name must resolve to a variable binding in an enclosing function scope. A missing binding, a top-level-only binding, or `outer` outside a nested function is a compile-time error. Early function registration does not initialize that binding; reads still require definite initialization.
- The name cannot also be a parameter or a separately declared local in that function.
- Reads and writes use the same enclosing binding. Its inferred or declared type stays unchanged, and every read still requires definite initialization.
- Bare-name writes using assignment, compound assignment, tuple unpacking, increment/decrement, `swap!`, `min!`, and `max!` all follow this rule.
- Without `outer`, an assignment introduces or updates a local binding even when an enclosing function has a variable with the same name. Reading the new local before initialization is an error; `diameter = max(diameter, candidate)` cannot implicitly read the outer `diameter`.
- Mutating a field or collection through a captured reference does not rebind the captured name and needs no `outer` declaration.

This keeps recursive helper locals separate while allowing an explicitly shared accumulator. See [Diameter of Binary Tree](/docs/examples/diameter-of-binary-tree/).

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
- Follow the corresponding binary operator and ordinary assignment type rules. In the current draft, these forms require an integer target and integer right-hand side. They do not introduce collection repetition, string concatenation, or implicit character conversions.
- Read locations using their normal rules. Invalid list indices fail; a missing ordinary map entry fails; a map with a default can insert that default; a missing counter entry reads as zero without insertion.
- Apply normal write behavior, including removing a counter key when its resulting count is zero.
- `//=` uses floor division, including for negative operands. A zero divisor causes a runtime error and does not write a quotient.
- Errors do not undo side effects from target evaluation, reading a map default, or evaluating the right-hand side.
- An uninitialized variable, a nonwritable target, incompatible types, and use inside an expression are errors. Rebinding an enclosing function's variable still requires `outer`.

See [Product of Array Except Self](/docs/examples/product-of-array-except-self/) for multiplication assignments in two indexed passes.

### Increment and decrement

- `target++` and `target--` are standalone statements with no result value.
- The target must be a writable integer location, such as a variable or map entry.
- Add or subtract one.
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

`max!(target, candidate)` keeps the larger integer in the target. `min!(target, candidate)` keeps the smaller integer.

```birdie
max!(longestSeq, currSeq)
max!(diameter, left + right)
min!(distances[node], candidate)
```

- Exactly two operands are required. The first must be an initialized writable integer location; the second must produce an `int`.
- Resolve the target location once and read its current value, then evaluate the candidate once. Use the same location-evaluation and scope rules as compound assignment.
- Write the candidate only when it is strictly larger for `max` or strictly smaller for `min`. Equal values leave the target unchanged, with no final write.
- Reads use normal location rules, including map-default insertion and nonmutating zero reads from counters. Writes use normal assignment behavior, including counter zero removal.
- A read or candidate evaluation can have its ordinary side effects even when the candidate does not improve the target. Errors do not roll those effects back.
- A new or uninitialized variable, a nonwritable target, incompatible operand types, and use inside an expression are errors. Rebinding an enclosing function's variable requires `outer`.

`max(a, b)` and `min(a, b)` remain ordinary value-returning function calls. Only the first argument of `max!` or `min!` is a writable argument; the candidate is evaluated as an ordinary value.

See [Longest Consecutive Sequence](/docs/examples/longest-consecutive-sequence/) for a running maximum update.

## Integers and division

- `int` is signed and arbitrary precision, with no fixed bit width or wrapping overflow.
- `int()` returns zero.
- Value size is limited by available resources. Operation costs depend on operand size.
- `//` is floor division. Integer operands produce an integer.
- Floor rounds toward negative infinity: `7 // 2` is `3`; `-7 // 2` is `-4`.
- `/` is reserved for fractional division.
- Division by zero causes a runtime error.

### Decimal conversions

`str(value)` formats an `int` as decimal text. `int(text)` parses a decimal `str` into an `int`. Both are built in and evaluate their argument once.

```birdie
label = str(42)       # "42"
negative = str(-7)    # "-7"
count = int("0042")   # 42
signed = int("-7")    # -7
```

- Formatting uses ASCII digits, a leading `-` for negative values, and no leading zeros except for `"0"` itself. It adds no whitespace or locale-specific separators.
- Parsing accepts an optional ASCII `+` or `-` followed by one or more ASCII digits: `[+-]?[0-9]+`. Leading zeros are allowed; `int("-0")` is zero.
- The entire input must match. Empty text, a sign alone, whitespace, digit separators, base prefixes, and non-ASCII digits cause a runtime error. Parsing does not trim text or return a fallback value.
- These conversions preserve arbitrary-precision integer values, subject to available resources. Conversion work depends on the number of digits and the integer's size.
- `str(value)` requires one `int`; `int(text)` requires one `str`. Incompatible argument types and unsupported argument counts are type errors. The existing zero-argument `int()` form still returns zero.

See [Encode and Decode Strings](/docs/examples/encode-and-decode-strings/) for decimal length headers.

### Minimum and maximum

`max(a, b)` returns the larger of two `int` values; `min(a, b)` returns the smaller. Both are built-in functions that need no imports.

- Both arguments must be integers. Other argument types and argument counts are type errors.
- Evaluate each argument once, from left to right, before comparing the values.
- The result has type `int`; equal arguments produce that same integer value.
- Calls return a value and do not rebind either argument. A discarded `max(a, b)` or `min(a, b)` result does not update `a` or `b`.
- Use [`max!(target, candidate)` or `min!(target, candidate)`](#minimum-and-maximum-updates) to update an initialized writable location instead.
- Variadic and collection forms remain undecided.

See [Maximum Depth of Binary Tree](/docs/examples/maximum-depth-of-binary-tree/) for a recursive use of `max`.

### Absolute value

`abs(value)` returns the nonnegative magnitude of an `int`, without modifying the argument.

```birdie
abs(-3)  # 3
abs(0)   # 0
abs(4)   # 4
```

- Exactly one integer argument is required and evaluated once. Incompatible argument types and other argument counts are type errors.
- The result has type `int`. Arbitrary precision avoids fixed-width minimum-integer overflow; work and storage depend on operand size.
- The built-in requires no imports or implicit conversions.

See [Balanced Binary Tree](/docs/examples/balanced-binary-tree/) for comparing child heights with `abs(right - left)`.

## Booleans and truthiness

- `bool` values are `true` and `false`.
- Conditions, `not`, `and`, and `or` accept booleans, lists, maps, counters, sets, stacks, and queues. Optional operands with one of these underlying types use a runtime presence check when needed.
- Empty collections are false; nonempty collections are true.
- A counter is empty when it has no nonzero counts. Negative counts make it nonempty too; summing to zero across different keys does not make it false.
- `not` returns a boolean. `not opened` tests whether a stack is empty.
- Numbers require explicit comparisons, such as `count != 0`.
- An optional condition tests its contained value, never its presence. A present `false` or empty collection is false; an absent value causes a runtime error. Use `== none` or `!= none` when the intended question is absence or presence. Records and integers remain invalid condition types, including their optional forms.
- `and` evaluates left to right and stops when its left operand is false. `or` evaluates left to right and stops when its left operand is true. Both return a `bool`, rather than returning an operand.
- Comparisons bind more tightly than `not`, then `and`, then `or`. Parentheses can override this grouping.
- Narrowing follows the paths that reach each operand: the right side of `and` uses facts from a true left side; the right side of `or` uses facts from a false left side. Branches and early returns retain the facts common to their reachable paths.

```birdie
if root != none and root.val == target:
    return true
```

```birdie
ready: bool? = false
disabled = not ready  # true: the present boolean is false
enabled = ready != none and ready  # false, also false if ready is absent
```

See [Same Tree](/docs/examples/same-tree/) for an `or` guard that checks two optional nodes before reading their fields, followed by a short-circuit recursive `and`.

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

### String slicing

`text[start:end]` returns a `str` containing the Unicode scalar values from `start` up to, but excluding, `end`.

```birdie
text = "bird"
middle = text[1:3]  # "ir"
empty = text[2:2]   # ""
```

- Both bounds must be integers satisfying `0 <= start <= end <= text.size`. Noninteger bounds are type errors; negative, reversed, or out-of-bounds ranges cause a runtime error. Bounds are not clamped.
- Evaluate the source, start, and end expressions once, in that order.
- Equal bounds produce an empty string, including when both equal `text.size`. Indexing a single position still returns a `char`; slicing returns a `str`.
- Slicing preserves the exact scalar sequence without normalization or mutation. It uses the same exclusive-end convention as [list prefix slicing](/docs/specification/collections/#prefix-slicing).
- The intended cost model permits one linear preprocessing pass per string for scalar indexing. After that preparation, size and indexed access should take constant time and copying a slice of length k should take O(k) work. The representation remains undecided; repeatedly scanning a UTF-8 prefix for each access would violate this cost target.

Additional omitted-bound forms, steps, and slice assignment remain open. See [Encode and Decode Strings](/docs/examples/encode-and-decode-strings/) for header and payload slices.

### Character codes

For a `char` value, `.code` is a read-only `int` containing its Unicode scalar value:

```birdie
a = 'a'.code
index = char.code - a
```

- `'a'.code` is `97`; `'z'.code` is `122`. Lowercase English letters therefore map to indices `0` through `25` when the code for `'a'` is subtracted.
- This is a Unicode scalar value, not a UTF-8 byte, encoding length, or locale-dependent alphabet position.
- Access it as a property, without parentheses. Assignment to `.code` and using the property on a `str` are type errors.
- No normalization or case conversion occurs. A fixed 26-slot table requires an explicit lowercase English input assumption.

### Character subtraction

Subtracting two `char` values returns an `int` equal to the difference of their Unicode scalar values. `left - right` has the same result as `left.code - right.code`:

```birdie
'd' - 'a'  # 3
'a' - 'd'  # -3
'a' - 'a'  # 0
```

- Both operands must be `char` values. Mixing a `char` and an `int` in subtraction is a type error; characters are not implicitly converted to integers.
- The result is an integer offset, not a character. Negative differences are valid.
- No normalization or locale-dependent alphabet ordering is applied. Code-point distance does not generally describe alphabet positions.
- Other character arithmetic remains open. Use `.code` when the raw scalar value is needed.

See [Valid Anagram](/docs/examples/valid-anagram/) for indexing a lowercase English frequency table with `c1 - 'a'`.

### Escapes

Supported escapes: `\n`, `\t`, `\r`, `\\`, `\'`, `\"`.

Escapes count as their resulting characters; `'\n'` is one `char`. Unknown escapes are syntax errors. Quoted literals cannot span source lines.

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
- [Loop bindings](/docs/specification/#loops) use the same parenthesized unpacking form.

## Open questions

- Visibility outside a block of variables first introduced inside it.
- Floating-point arithmetic.
- Remainder semantics and explicit truncating division.
- Conversion and concatenation between `char` and `str`.
- Conversion from an integer code to a `char`.
- Record-to-record equality and hashing, methods, and named constructor arguments.
