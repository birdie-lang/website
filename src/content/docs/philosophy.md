---
title: Philosophy
description: Why Birdie exists and how we make language design decisions.
navTitle: Philosophy
section: project
order: 0
---

Birdie is for solving algorithmic problems, especially in coding interviews and programming challenges. The goal is to express a solution as clearly as the pseudocode you'd use to explain it, and be able to run that code.

Python is the starting point. We keep its readable, indentation-based style and look for ways to make writing algorithms simpler. Birdie focuses on the things you need while solving a problem, so you can spend more of your attention on the solution.

## Readable code comes first

Code should be easy to follow and comfortable to write while you're still figuring out the algorithm. Shorter syntax helps when it makes the idea clearer. If saving a few characters makes the behavior harder to understand, we keep the longer form.

## Less routine setup

Common data structures should be ready to use, with little setup. You should be able to reach for a stack or a map without stopping to arrange imports or write a wrapper. Convenience should still leave enough of the algorithm visible to explain why it works and discuss its complexity.

## Types that help

Static types describe the data and catch mistakes. Inference keeps annotations from becoming repetitive, and type information can help editors offer useful suggestions. We also accept runtime checks when requiring a static proof would add distracting code to a straightforward solution.

## A small, consistent language

Every feature adds something to learn. We prefer a few rules that work across many problems, and familiar syntax where it fits. A new feature should be useful beyond the example that first suggested it.

We develop Birdie through [example problems](/examples), often comparing the same algorithm in Python and Birdie. That gives us something concrete to judge each design choice against and helps us spot where the language gets in the way.

The [specification](/docs/specification) records the proposed syntax and behavior.
