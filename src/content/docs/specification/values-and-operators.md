---
title: Built-in values & operators
description: Numbers, comparisons, truthiness, strings, and characters.
navTitle: Built-in values & operators
section: specification
order: 3
---

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

See [Validate Binary Search Tree](/examples/validate-binary-search-tree) for bounds that start at `-inf` and `inf` and become integer node values in recursive calls.

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

See [Encode and Decode Strings](/examples/encode-and-decode-strings) for decimal length headers.

### Minimum and maximum

`max(a, b)` returns the larger of two numeric values; `min(a, b)` returns the smaller. Both are built-in functions that need no imports.

- Both arguments must have type `int` or `number`. Other argument types and argument counts are type errors.
- Evaluate each argument once, from left to right, before comparing the values.
- The result has type `int` when both arguments have type `int`, or `number` otherwise. Equal arguments return the first value. Integer and infinity comparisons use the exact ordering above.
- Calls return a value and do not rebind either argument. A discarded `max(a, b)` or `min(a, b)` result does not update `a` or `b`.
- Use [`max!(target, candidate)` or `min!(target, candidate)`](/docs/specification/types#minimum-and-maximum-updates) to update an initialized writable location instead.
- Variadic and collection forms remain undecided.

See [Maximum Depth of Binary Tree](/examples/maximum-depth-of-binary-tree) for a recursive use of `max`.

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

See [Balanced Binary Tree](/examples/balanced-binary-tree) for comparing child heights with `abs(right - left)`.

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

See [Same Tree](/examples/same-tree) for an `or` guard that checks two optional nodes before reading their fields, followed by a short-circuit recursive `and`.

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

### Splitting strings

`text.split(separator)` returns a fresh `list[str]` of pieces separated by exact occurrences of a nonempty `str` separator:

```birdie
"bird,song".split(",") # ["bird", "song"]
"a,,b,".split(",")    # ["a", "", "b", ""]
"".split(",")         # [""]
```

- Exactly one `str` separator is required. An empty separator causes a runtime error; a missing argument or incompatible type is a compile-time error. There is no implicit whitespace mode, regular expression, or split limit in this form.
- Evaluate the receiver and separator once, in that order. Scan left to right for nonoverlapping matches of the exact Unicode scalar sequence, without normalization. After a match, continue after that separator.
- Keep empty pieces at the beginning, between adjacent separators, and at the end. If there is no match, return a one-element list containing the whole source, including when the source is empty. Multiple-scalar separators are supported.
- Splitting is eager. It leaves the source unchanged and constructs every piece before returning. The intended cost is O(n + s) work for n source scalars and s separator scalars, with O(n + k) result storage for k pieces; repeated rescanning must not make a split quadratic.
- The result is a mutable list of immutable strings. `text.split(separator).iter()` creates a cursor over that list; it does not make splitting lazy. Lazy splitting remains open.

See [Serialize and Deserialize Binary Tree](/examples/serialize-and-deserialize-binary-tree) for splitting a preorder encoding into tokens.

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
- Slicing preserves the exact scalar sequence without normalization or mutation. It uses the same inclusive-start, exclusive-end convention as [list slicing](/docs/specification/collections/lists#slicing).
- The intended cost model permits one linear preprocessing pass per string for scalar indexing. After that preparation, size and indexed access should take constant time and copying a slice of length k should take O(k) work. The representation remains undecided; repeatedly scanning a UTF-8 prefix for each access would violate this cost target.

Slice steps and slice assignment remain open. See [Encode and Decode Strings](/examples/encode-and-decode-strings) for header and payload slices.

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

See [Valid Anagram](/examples/valid-anagram) for indexing a lowercase English frequency table with `c1 - 'a'`.

### Escapes

Supported escapes: `\n`, `\t`, `\r`, `\\`, `\'`, `\"`.

Escapes count as their resulting characters; `'\n'` is one `char`. Unknown escapes are syntax errors. Quoted literals cannot span source lines.

## Open questions

- Floating-point arithmetic.
- Remainder semantics and explicit truncating division.
- Conversion and concatenation between `char` and `str`.
- Conversion from an integer code to a `char`.
