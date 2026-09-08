---
title: 'Per-producer ordering in LUBQ'
summary: 'How LUBQ preserves each producer’s sequence without imposing one global FIFO order.'
order: 1
inProgress: true
related: ['/writing/ubq/queue-interface']
---

A continuation of UBQ that distributes producers across several single-producer, multi-consumer (SPMC) queues. Each producer has its own queue, preserving that producer's sequence without enforcing one global FIFO order across producers.

If producer A enqueues a value before producer B enqueues another, a consumer visiting B's queue can return B's value first. This differs from UBQ's single queue order. The [LUBQ implementation](https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/kfifo/lubq.rs) contains the sender and receiver operations.

<!-- Editorial note: The supplied example now explains the ordering directly. Use "per-producer FIFO" for this account; a numerical kFIFO relaxation bound has not been established here. Revisit the terminology only when that bound has a precise definition and supporting argument.
-->

<!-- Editorial note: Add two sentences explaining a workload for which this ordering is useful, and why global FIFO is unnecessary there. Response: -->

This account refers to [UBQ revision `b8fce0a`](https://github.com/Orkking2/UBQ/commit/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2).
