---
title: 'The UBQ interface'
summary: 'An introduction to UBQ’s FIFO order, linked blocks, and Rust interface.'
inProgress: true
---

## The queue from the outside

A FIFO (First-In, First-Out) queue preserves the order in which items are enqueued. MPMC (Multi-Producer, Multi-Consumer) means multiple producers and consumers, making establishing and observing order a synchronization problem. Two producers must not claim the same slot, and a consumer must not read a value before its producer has finished writing it.

Why? Because of something called a _race_. Imagine two producers are given the same slot within which to write their value, how is it decided which of those producers gets to conduct the operation to physically modify the required memory? Simply: it isn't. Your OS scheduler is ultimately the decision-maker for which thread gets the right-of-way, but because it has no understanding of the syncrhonization (or, in this case, the lack thereof) happening under the hood. The scheduler tries to drive threads in whatever opaque ordering is "most efficient" by its determination, often creating unpredictable or essentially random orderings and timings.

The end effect of these pseudo-random scheduling is the race (aka "data race"), where the two threads, say thread A and B, clobber the write of the other. Imagine the scenario where thread A makes progress in the write, is preempted (descheduled in favor of another thread) by thread B, and waits. Thread B, now being driven, overwrites the modifications of thread A, perhaps even completing a full write to the slot. So the state of the slot is now fully the object that thread B wrote, but thread A is not aware of this. As far as thread A is concerned, the slot is still partially filled with thread A's object, so when thread A is resumed, it continues writing the rest of its object into the slot. The net object written is then partially from B and partially from A. It is simply not possible to reason about the state of the slot any further -- for example if one wanted to reconstruct object A or B -- and it must be dumped as garbage.

Unbounded, as the word would suggest, means simply that the queue is not _bounded_. A bounded queue is backed by a preallocated swathe of memory that is immutable (unchanging). When the number of objects in the queue require a representation in memory larger than this preallocation the queue must make a choice: either it can override an old value with a new one, losing information, or it can fail the push operation, informing the caller that the queue is full. UBQ avoids this tricky decision by allowing for more allocations to occur dynamically. There is, of course, still a hard limit on how much memory the system can supply, and so no queue is every truly "unbounded", but because more memory can be added physically into a system, it is as close as one can get.

The [basic Rust interface][implementation] consists of `push`, which adds a value (and has no failure case), and `pop`, which returns a value or `None` when the queue is empty. A sequential example shows the intended behavior without introducing thread scheduling:

```rust
use ubq::UBQ;

let queue: UBQ<u64> = UBQ::new();
queue.push(10);
queue.push(20);

assert_eq!(queue.pop(), Some(10));
assert_eq!(queue.pop(), Some(20));
assert_eq!(queue.pop(), None);
```

This is admittedly the naive scalar interface, and a more nuanced batched interface exists which changes the parameters of these functions. Specifically, when calling push, the caller must provide an iterator of items with a known length (e.g. a slice or vec iterator), and when calling pop, the caller must provide a "target", or the number of elements the caller would like to attempt to pop from the queue. This pop returns an iterator instead of an optional (although optionals are also iterators) with a quantity of elements less-than or equal-to the target.

This account refers to [UBQ revision `b8fce0a`][revision].

[implementation]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/queue.rs
[revision]: https://github.com/Orkking2/UBQ/commit/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2
