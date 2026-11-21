---
title: Records & optional values
description: Record declarations, constructors, optional values, and conditional returns.
navTitle: Records & optional values
section: specification
order: 2
---

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

## Open questions

- Record-to-record equality and hashing, methods, and named constructor arguments.
