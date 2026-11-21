---
title: Collections
description: Shared rules for Birdie’s built-in collections and links to their individual APIs.
navTitle: Collections
section: specification
order: 4
---

Lists, maps, counters, sets, stacks, and queues are built in and require no imports.

Collections and strings expose a read-only `int` property, `.size`. It counts list, stack, or queue elements, map entries, distinct set elements, counter keys with nonzero counts, or Unicode scalar values in a string. Iterators are cursors rather than collections and have no `.size` property.

The operation types below describe present values. Optional receivers and operands with compatible underlying types follow [checked optional use](/docs/specification/records-and-optionals/#checked-optional-use); absence fails at runtime when a present value is required.

Integer-only inputs such as indices and construction counts also accept `number` values through a [finite-value check](/docs/specification/values-and-operators/#compatibility-and-exact-ordering). An infinity fails at that use site. Integer elements can be stored in `number` collections without losing precision.

## Chapters

- [Lists](/docs/specification/collections/lists/) cover construction, indexing, and slicing.
- [Maps, sets & counters](/docs/specification/collections/maps-sets-counters/) cover lookup, membership, and frequency counts.
- [Stacks & queues](/docs/specification/collections/stacks-and-queues/) cover LIFO and FIFO operations.
- [Iterators](/docs/specification/collections/iterators/) cover cursors, parallel iteration, and lazy predicate checks.

## Further candidates

Heaps and deques are priorities for exploration. Sorted sets, union-find, tries, and graph/grid helpers are also candidates. Their APIs have not been defined here.
