---
title: 'The UBQ interface'
summary: 'An introduction to UBQ’s FIFO order, linked blocks, and Rust interface.'
order: 1
inProgress: true
---

## The queue from the outside

A FIFO queue preserves the order in which items are enqueued. Multiple producers and consumers make establishing and observing that order a synchronization problem. Two producers must not claim the same slot, and a consumer must not read a value before its producer has finished writing it.

Unbounded means that the queue can acquire more storage as it grows, rather than having a fixed total capacity chosen at construction. Available memory remains a limit. UBQ groups slots into linked blocks, so extending the queue provides space for several values at once.

The [basic Rust interface][implementation] consists of `push`, which adds a value, and `pop`, which returns a value or `None` when the queue is empty. A sequential example shows the intended behavior without introducing thread scheduling:

```rust
use ubq::UBQ;

let queue: UBQ<u64> = UBQ::new();
queue.push(10);
queue.push(20);

assert_eq!(queue.pop(), Some(10));
assert_eq!(queue.pop(), Some(20));
assert_eq!(queue.pop(), None);
```

This account refers to [UBQ revision `b8fce0a`][revision].

[implementation]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/queue.rs
[revision]: https://github.com/Orkking2/UBQ/commit/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2
