---
title: Iterators
description: Single-pass cursors, parallel iteration, and lazy predicate checks.
navTitle: Iterators
section: specification
order: 8
---

## Explicit iterators

`iterator[T]` is a mutable, single-pass cursor. The initial API creates cursors over lists and strings:

```birdie
items = [10, 20, 30]
cursor = items.iter()
first = cursor.next() # 10

shared = cursor
second = shared.next() # 20; advances cursor too

for value in cursor:
    # Visits only 30.
    last = value
```

- `items.iter()` returns a fresh `iterator[T]` starting at the first list element. `text.iter()` returns an `iterator[char]` traversing Unicode scalars. Both take no arguments and evaluate their receiver once.
- Each `.iter()` call creates an independent position. The cursor retains its source without copying its contents, even if the variable holding that source is later reassigned.
- Assignment, parameter passing, and capture share the iterator object and its position. They do not clone or restart it. Advancing through one reference affects all references to that iterator.
- `cursor.next()` takes no arguments, consumes one element, and returns `T` using ordinary assignment semantics. An exhausted cursor raises a runtime exhaustion error. It does not return a sentinel or an optional wrapper; if `T` is optional, an element equal to `none` is still an ordinary consumed element.
- `for value in cursor:` evaluates and retains the cursor once, then consumes from its current position. Exhaustion ends the loop normally, using an internal end signal distinct from every element value. Other errors propagate. Additional reads from the same cursor inside the body advance that same position.
- A consumed element stays consumed if the body exits or raises an error. `continue` advances normally to the next remaining element; `return` leaves the cursor at its current position. An exhausted iterator stays exhausted, and a later loop over it runs zero times.
- Tuple elements can use parenthesized unpacking. Comprehension and predicate clauses can use the same single-value iterator traversal; they consume the source too. Indexed and reverse iterator traversal remain open.
- An iterator is not a collection and has no truthiness, indexing, `.size`, reset, or implicit copy. Use `for` for exhaustion-aware traversal. Incompatible receiver types, arguments to `.iter()` or `.next()`, and unsupported operations are compile-time errors.
- Creating a list cursor takes O(1) work and auxiliary storage; advancing it takes O(1). String cursors allow the existing one-time linear Unicode preparation, followed by O(1) work per scalar. The retained source stays alive for the cursor's lifetime.

Mutating a source list during traversal remains open, as for ordinary collection loops. This API does not yet add cursors for maps, sets, counters, stacks, queues, ranges, `zip`, or generator expressions. Custom iterator protocols, `yield`, generator functions, and iterator combinators remain open.

See [Serialize and Deserialize Binary Tree](/docs/examples/serialize-and-deserialize-binary-tree/) for recursive calls consuming a shared token cursor. Advancing a captured iterator mutates the cursor; it does not rebind its name and needs no `outer` capture entry.

## Lazy traversal and predicate checks

### Parallel iteration

`zip(left, right)` provides a lazy sequence of pairs from two lists or strings. The two sources can have different element types. String elements are `char` values.

```birdie
for (c1, c2) in zip(s, t):
    freqs[c1 - 'a']++
    freqs[c2 - 'a']--
```

- Evaluate both source expressions once, from left to right, when `zip` is called.
- Check their element counts at that call. Unequal lengths cause a runtime error; values are never silently truncated.
- Traverse both sources forwards, yielding one pair at a time without constructing an intermediate list of pairs.
- Two empty sources produce an empty traversal. Exactly two sources are required in this draft.
- Use parentheses to unpack a pair, following the [loop-binding rules](/docs/specification/#loops). A single binding receives the pair itself.
- Values preserve their usual assignment semantics; yielding a record or collection reference does not copy the underlying object.

Broader input types and reverse traversal of zipped values remain open. Mutation during traversal follows the existing open question about collection iteration.

### Predicate expressions and `all`

`all(predicate for ...)` checks a predicate lazily using the same bindings and traversals as an ordinary loop, including lists, strings, explicit iterators, ranges, sets, counter key/count traversal, and `zip`:

```birdie
return all(value == 0 for value in freqs)
```

- An expression followed by one or more `for` clauses describes a lazy generator. Evaluate its outermost source or range bounds when the generator is created. Evaluate inner sources when preceding clauses produce a new combination, and evaluate the element expression only for combinations that are consumed.
- The binding takes its type from the source and is local to the generator expression. It neither replaces an enclosing binding nor leaks outside the expression. Parenthesized tuple unpacking follows the loop-binding rules.
- Expressions can read visible enclosing variables using their normal binding semantics. Values are observed when the expression is evaluated, rather than copied into a separate boolean list.
- `all` requires boolean elements and returns a `bool`. An integer predicate is a type error; it is not converted using truthiness.
- Visit elements in source order. Stop at the first false result without evaluating later predicates. An empty source returns true.
- `all` also accepts an ordinary `list[bool]`. It takes exactly one argument. A generator used as its sole argument needs no extra parentheses.
- Evaluate only the values needed to determine the result; propagate errors from evaluations that are reached. Do not materialize an intermediate list of predicate results.

Multiple clauses follow the same nesting and scope rules as [list comprehensions](/docs/specification/#list-comprehensions). Reusable generator type syntax, escaping generator lifetimes, and filtering remain open.

See [Valid Anagram](/docs/examples/valid-anagram/) for a strict zipped traversal followed by a lazy zero-count check.
