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

### Conditional return

`return? expression` returns an optional expression's payload when it is present. When the expression is `none`, execution proceeds to the next statement.

```birdie
return? dfs(node.left)
```

This has the same control flow as the following code, without introducing a visible local binding:

```birdie
left = dfs(node.left)
if left != none:
    return left
```

- Write `return?` with the `?` immediately after the keyword. It is a standalone statement requiring an expression, not an expression itself. Use outside a function is a compile-time error.
- The expression must have an optional type `T?`. A nonoptional operand is a type error; this form does not implicitly add optionality to an already present expression.
- Evaluate the expression exactly once. If it is present, return its `T` payload from the nearest enclosing function, using ordinary return compatibility and value checks. An incompatible payload type is a compile-time error, even if the expression might be absent at runtime.
- Presence is independent of truthiness. A present `0`, `false`, empty string, or empty collection is returned unchanged. Records and collections retain their normal reference semantics.
- If the expression is absent, perform no return and run the next statement. Inside a loop, execution remains in the current iteration. This statement does not supply an implicit `return none` or another fallback; write subsequent control flow for the unmatched case.
- The enclosing function can have a nonoptional or optional return type. During inference, the statement contributes a possible return of `T` and leaves a fallthrough path; absence alone does not contribute a `none` result type.
- Evaluation errors and uninitialized reads propagate normally. The statement does not catch errors or undo side effects. A successful conditional return skips the remaining function body.

The position of `?` determines the control flow:

```birdie
return? find()    # Present: return its payload. Absent: run the next statement.
value = find()?  # Present: unwrap. Absent: return none from this function.
```

The second form still requires an optional-returning function. `return find()?` also retains ordinary postfix propagation: it returns the found payload or returns `none`, so it does not fall through on absence.

See [Kth Smallest Element in a BST](/docs/examples/kth-smallest-element-in-a-bst/) for propagating a found value, including zero, while continuing the traversal when a subtree contains no result.

## Inference

- Birdie is statically typed.
- Infer local variables, return types, and collection type arguments from usage.
- Infer locals from later uses within the same function or top-level script body.
- Check independently defined functions without inferring their types from callers.
- Function parameter types are explicit. Return annotations are optional when the body determines the type unambiguously.
- Require an annotation when inference is ambiguous. Do not fall back to a dynamic type.
- Conflicting underlying type constraints are type errors. An annotation does not resolve incompatible uses. Integers and `number` values have the common numeric type `number`; an initializer or direct assignment containing infinity contributes that wider type. Nullable-to-present and `number`-to-`int` uses follow their runtime checks rather than requiring a proof of presence or finiteness.
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
- Assignment syntax requires an initializer expression. There is no declaration-only form.
- Ordinary branches and loops do not introduce a variable scope. A name first assigned inside one belongs to the enclosing function, or to the file for top-level code, and is visible outside that block.
- Reads check initialization at runtime when it is not already known. A path that reaches a read without assigning that binding raises a runtime error; a static proof of assignment on every path is not required.
- Assignment inside a branch or loop creates or updates the same function-local binding. Crossing a function boundary requires `outer`.

### Scope and initialization

Names resolve lexically from the source's enclosing scopes. A function cannot read a caller's locals merely because that caller invokes it. Scope, static type, and runtime initialization are separate properties of a binding.

```birdie
fn chosenValue(ready: bool) int:
    if ready:
        value = 3

    return value + 1
```

`value` is a function-local `int`. `chosenValue(true)` returns `4`; `chosenValue(false)` raises an initialization error when reading `value`, before performing the addition. Both calls use the same statically checked function body.

- Determine local names from assignments and ordinary `for` bindings across the whole function body, including branches and loops. Nested function and comprehension bindings belong to their own scopes. Types follow the ordinary inference rules; all assignments must fit a binding's inferred or declared type, even when conditional. Uninitialized state does not widen that type or introduce `any`.
- A local binding exists throughout its function body, including before its first assignment. A read before an executed assignment raises a runtime error instead of falling back to an enclosing variable of the same name. A name with no binding in any applicable lexical scope is a compile-time error.
- Each function call starts with initialized parameters and uninitialized ordinary locals. Executing an assignment initializes or updates its target after evaluating the right-hand side. The declaration syntax still requires an initializer; there is no declaration-only form.
- An uninitialized binding is an internal runtime state, distinct from every language value, including `none`, `0`, and `false`. Reading it, even in `value == none`, fails. No default value is supplied.
- Branches and loop iterations share the enclosing function's bindings. Skipping an assignment or executing a loop zero times leaves an existing value unchanged; a binding that has never received a value stays uninitialized.
- Ordinary `for` bindings follow the same assignment rules and are visible after the loop. Comprehension and generator bindings remain local to their expressions, as specified separately.
- Captures retain lexical bindings and use the same initialization checks. Registering a nested helper does not initialize its captured locals. Calling it before a captured value is assigned fails if that value is read; calling it after assignment observes the stored value.
- Compound assignments, increments, and in-place operations read their targets using the same rules. They cannot initialize an uninitialized binding by reading a default value.

See [Binary Tree Right Side View](/docs/examples/binary-tree-right-side-view/) for using the last node assigned inside `repeat` after that loop finishes.

### Outer variables

`outer name` lets a nested function rebind a variable from the nearest enclosing function scope that defines it. It is a scope declaration, with no runtime result value.

```birdie
outer diameter
```

- Write one name per declaration, at the start of the nested function body before using or assigning that name. The declaration applies throughout that function body.
- The name must resolve to a variable binding in an enclosing function scope. A missing binding, a top-level-only binding, or `outer` outside a nested function is a compile-time error. Early function registration does not initialize that binding; a read before assignment fails at runtime.
- The name cannot also be a parameter or a separately declared local in that function.
- Reads and writes use the same enclosing binding. Its inferred or declared type stays unchanged, and reads use the runtime initialization checks above. Ordinary assignment through `outer` can initialize the enclosing binding.
- Bare-name writes using assignment, `for` bindings, compound assignment, tuple unpacking, increment/decrement, `swap!`, `min!`, and `max!` all follow this rule.
- Without `outer`, an assignment introduces or updates a local binding even when an enclosing function has a variable with the same name. Reading the new local before initialization is a runtime error; `diameter = max(diameter, candidate)` cannot implicitly read the outer `diameter`.
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
- Follow the corresponding binary operator and ordinary assignment type rules. Targets can have type `int` or `number`. `+=`, `-=`, and `*=` use the numeric arithmetic rules below; `//=` requires finite integer operands. A result written to an `int` target must be finite. These operations do not introduce collection repetition, string concatenation, or implicit character conversions.
- Read locations using their normal rules. Invalid list indices fail; a missing ordinary map entry fails; a map with a default can insert that default; a missing counter entry reads as zero without insertion.
- Apply normal write behavior, including removing a counter key when its resulting count is zero.
- `//=` uses floor division, including for negative operands. A zero divisor causes a runtime error and does not write a quotient.
- Errors do not undo side effects from target evaluation, reading a map default, or evaluating the right-hand side.
- Reading an uninitialized target fails at runtime before evaluating the right-hand side. Undefined names, nonwritable targets, incompatible types, and use inside an expression are compile-time errors. Rebinding an enclosing function's variable still requires `outer`.

See [Product of Array Except Self](/docs/examples/product-of-array-except-self/) for multiplication assignments in two indexed passes.

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
- Reading an uninitialized target fails at runtime before evaluating the candidate. Undefined names, nonwritable targets, incompatible operand types, and use inside an expression are compile-time errors. Rebinding an enclosing function's variable requires `outer`.

`max(a, b)` and `min(a, b)` remain ordinary value-returning function calls. Only the first argument of `max!` or `min!` is a writable argument; the candidate is evaluated as an ordinary value.

See [Longest Consecutive Sequence](/docs/examples/longest-consecutive-sequence/) for a running maximum update.

## Numbers and infinity

`int` contains finite arbitrary-precision integers. `number` contains those same integer values plus negative and positive infinity. There are no floating-point values, fractions, or NaN in the current numeric design.

`inf` is a reserved numeric literal of type `number`, available without imports. `-inf` applies unary negation to produce negative infinity. Finite integer literals still have type `int`.

```birdie
lower: number = -inf
upper: number = inf
best = inf
min!(best, 7)
min!(best, 3)  # best now holds 3, with static type number
```

### Compatibility and exact ordering

- Every `int` can be used where `number` is expected. This preserves its exact integer value, without conversion to floating point or a fixed-width representation.
- When an operation, argument, assignment, or return requires `int` and receives `number`, check that it contains a finite integer. Use that integer unchanged, or raise a runtime error if it is infinite. For example, `repeat inf:` fails before entering the body. Indices, collection sizes, ranges, and counter counts remain finite integers.
- A binding's inferred type stays `number` after a checked finite use. Inference can preserve an integer type when only integer values are involved; combining integers and infinity in an inferred binding or collection gives the common element type `number`.
- All numeric comparisons accept integers and `number` values. Negative infinity is below every finite integer; positive infinity is above every finite integer. Each infinity equals itself, and the two infinities are unequal. Finite values compare exactly, regardless of their size.
- Numeric values are immutable. Widening an integer to `number` does not change its value, and arithmetic must not mutate integer values held by other bindings or AST literals.
- Numeric equality and hashing agree across integer and `number` uses. A finite numeric key hashes like the same integer key; each infinity has stable equality and hashing. This permits `number` keys in maps, sets, and counters, using their existing order rules.
- `number?` adds ordinary absence to this numeric domain. `none` is distinct from both infinities and has no numeric ordering. Neither integers nor `number` values have implicit truthiness.

See [Validate Binary Search Tree](/docs/examples/validate-binary-search-tree/) for bounds that start at `-inf` and `inf` and become integer node values in recursive calls.

### Arithmetic

Unary `+` preserves a numeric value; unary `-` negates it and exchanges the two infinities. Both preserve the operand's static numeric type. Binary `+`, `-`, and `*` return `int` for two `int` operands, or `number` when either operand has static type `number`. Finite arithmetic remains exact.

| Operation | Result |
| --- | --- |
| An infinity plus a finite integer | The same infinity |
| Two infinities with the same sign added together | That infinity |
| Opposite infinities added together | Runtime error |
| Subtraction | Add the negation of the right operand; the same addition rules apply |
| An infinity multiplied by a nonzero integer or another infinity | Infinity with the product's sign |
| Zero multiplied by an infinity | Runtime error |

For example, `inf + 5` is `inf`, `5 - inf` is `-inf`, and `inf - inf` raises a runtime error. Undefined operations produce an error, without introducing NaN. Evaluate operands once, from left to right; errors do not undo earlier effects or write a compound-assignment result.

Floor division `//` continues to require finite integers, using the checked finite-use rule when an operand has type `number`. Division by zero fails as before. Fractional division remains open.

## Integers and division

- `int` is finite, signed, and arbitrary precision, with no fixed bit width or wrapping overflow.
- `int()` returns zero.
- Value size is limited by available resources. Operation costs depend on operand size.
- `//` is floor division. Integer operands produce an integer.
- Floor rounds toward negative infinity: `7 // 2` is `3`; `-7 // 2` is `-4`.
- `/` is reserved for fractional division.
- Division by zero causes a runtime error.

### Decimal conversions

`str(value)` formats a numeric value as text. `int(text)` parses a decimal `str` into an `int`. Both are built in and evaluate their argument once.

```birdie
label = str(42)       # "42"
negative = str(-7)    # "-7"
count = int("0042")   # 42
signed = int("-7")    # -7
```

- Finite integer formatting uses ASCII digits, a leading `-` for negative values, and no leading zeros except for `"0"` itself. It adds no whitespace or locale-specific separators. Infinities format as `"inf"` and `"-inf"`.
- Parsing accepts an optional ASCII `+` or `-` followed by one or more ASCII digits: `[+-]?[0-9]+`. Leading zeros are allowed; `int("-0")` is zero.
- The entire input must match. Empty text, a sign alone, whitespace, digit separators, base prefixes, and non-ASCII digits cause a runtime error. Parsing does not trim text or return a fallback value.
- These conversions preserve arbitrary-precision integer values, subject to available resources. Conversion work depends on the number of digits and the integer's size.
- `str(value)` requires one `int` or `number`; `int(text)` requires one `str`. `int(value)` also accepts a numeric value, returning its finite integer unchanged or raising a runtime error for an infinity. Incompatible argument types and unsupported argument counts are type errors. The zero-argument `int()` form still returns zero. Parsing `"inf"` or `"-inf"` as an integer is an error.

See [Encode and Decode Strings](/docs/examples/encode-and-decode-strings/) for decimal length headers.

### Minimum and maximum

`max(a, b)` returns the larger of two numeric values; `min(a, b)` returns the smaller. Both are built-in functions that need no imports.

- Both arguments must have type `int` or `number`. Other argument types and argument counts are type errors.
- Evaluate each argument once, from left to right, before comparing the values.
- The result has type `int` when both arguments have type `int`, or `number` otherwise. Equal arguments return the first value. Integer and infinity comparisons use the exact ordering above.
- Calls return a value and do not rebind either argument. A discarded `max(a, b)` or `min(a, b)` result does not update `a` or `b`.
- Use [`max!(target, candidate)` or `min!(target, candidate)`](#minimum-and-maximum-updates) to update an initialized writable location instead.
- Variadic and collection forms remain undecided.

See [Maximum Depth of Binary Tree](/docs/examples/maximum-depth-of-binary-tree/) for a recursive use of `max`.

### Absolute value

`abs(value)` returns the nonnegative magnitude of a numeric value, without modifying the argument.

```birdie
abs(-3)  # 3
abs(0)   # 0
abs(4)   # 4
```

- Exactly one `int` or `number` argument is required and evaluated once. Incompatible argument types and other argument counts are type errors.
- An `int` argument returns `int`; a `number` argument returns `number`. `abs(inf)` and `abs(-inf)` both return `inf`. Finite values preserve arbitrary precision; work and storage depend on operand size.
- The built-in requires no imports or floating-point conversions.

See [Balanced Binary Tree](/docs/examples/balanced-binary-tree/) for comparing child heights with `abs(right - left)`.

## Chained comparisons

Comparisons can form a chain of adjacent tests:

```birdie
lower < value < upper
0 <= index < items.size
not lower < value < upper
```

`lower < value < upper` tests `lower < value` and then `value < upper`, retaining the first evaluation of `value`. It does not compare a boolean result with `upper`.

- Chains can combine `<`, `<=`, `>`, `>=`, `==`, and `!=`. Each adjacent pair must support its own comparison under the ordinary type rules. Chaining does not introduce new ordering or equality for any type.
- Evaluate operands from left to right, at most once each. Compare the first two values; only if that comparison succeeds, evaluate the next operand and compare it with the retained middle value. Continue in the same way through longer chains.
- Stop at the first false comparison without evaluating later operands. The chain returns a `bool`: false on the first failure, or true when all comparisons succeed.
- Retained operands use normal value and reference semantics. A call used as a middle operand runs once, even though its result participates in two comparisons. Later changes to the original variable do not replace a value already retained by the chain.
- Type-check every adjacent pair before execution, including comparisons that might be skipped at runtime. Explicit parentheses delimit expressions: `(a < b) < c` attempts to order a boolean against `c`, and is a type error when `c` is an integer.
- Chains bind more tightly than `not`, `and`, and `or`. `not lower < value < upper` negates the result of the whole chain. `and` and `or` can combine complete chains with other conditions.
- Optional operands keep their existing rules. `== none` and `!= none` inspect presence; an ordering comparison requires present values and checks them at runtime when needed. `none` has no implicit lower-bound or upper-bound ordering.

## Booleans and truthiness

- `bool` values are `true` and `false`.
- Conditions, `not`, `and`, and `or` accept booleans, lists, maps, counters, sets, stacks, and queues. Optional operands with one of these underlying types use a runtime presence check when needed.
- Empty collections are false; nonempty collections are true.
- A counter is empty when it has no nonzero counts. Negative counts make it nonempty too; summing to zero across different keys does not make it false.
- `not` returns a boolean. `not opened` tests whether a stack is empty.
- Numbers require explicit comparisons, such as `count != 0`.
- An optional condition tests its contained value, never its presence. A present `false` or empty collection is false; an absent value causes a runtime error. Use `== none` or `!= none` when the intended question is absence or presence. Records, integers, and `number` values remain invalid condition types, including their optional forms.
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

`text[start:end]` returns a `str` containing the Unicode scalar values from the inclusive `start` up to, but excluding, `end`. An omitted start means zero; an omitted end means the string's size. The forms `text[:end]`, `text[start:]`, and `text[:]` follow the same rules.

```birdie
text = "bird"
middle = text[1:3]  # "ir"
empty = text[2:2]   # ""
suffix = text[2:]   # "rd"
```

- Both bounds must be finite integers under the ordinary checked-use rules and satisfy `0 <= start <= end <= text.size`. Incompatible bound types are compile-time errors; negative, reversed, or out-of-bounds ranges cause a runtime error. Bounds are not clamped.
- Evaluate and retain the source, then each explicit bound once, from left to right, applying required presence and finite-value checks before evaluating the next operand. Supply omitted bounds after those evaluations and validate the range against the retained string.
- Equal bounds produce an empty string, including when both equal `text.size`. Indexing a single position still returns a `char`; slicing returns a `str`.
- Slicing preserves the exact scalar sequence without normalization or mutation. It uses the same inclusive-start, exclusive-end convention as [list slicing](/docs/specification/collections/#slicing).
- The intended cost model permits one linear preprocessing pass per string for scalar indexing. After that preparation, size and indexed access should take constant time and copying a slice of length k should take O(k) work. The representation remains undecided; repeatedly scanning a UTF-8 prefix for each access would violate this cost target.

Slice steps and slice assignment remain open. See [Encode and Decode Strings](/docs/examples/encode-and-decode-strings/) for header and payload slices.

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

- Floating-point arithmetic.
- Remainder semantics and explicit truncating division.
- Conversion and concatenation between `char` and `str`.
- Conversion from an integer code to a `char`.
- Record-to-record equality and hashing, methods, and named constructor arguments.
