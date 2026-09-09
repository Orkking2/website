---
title: Head packing in UBQ
summary: How UBQ represents a block address and slot index together.
inProgress: true
---

## Where the design begins

While the name derives from [BBQ, the Block-based Bounded Queue][bbq] presented at USENIX ATC 2022, the implementation is largly derived from Crossbeam's `SegQueue`.

[`SegQueue`][segqueue] keeps a separate atomic index and atomic block pointer at each end of the queue. The index also carries information beyond a simple offset; its value is used to derive the position within a block. When the queue advances to another block, the implementation coordinates the index and pointer updates so that a thread uses the appropriate pair.

UBQ packs the block address and local index together. There is still a producer head and a consumer head, each with its own atomic word. The compaction concerns the representation of each head; the queue also has shared state for slot publication, block links, and memory reuse.

## Packing a head

Alignment creates room in a pointer representation. If an allocation is aligned to 4,096 bytes, for example, its address is a multiple of 4,096, and its lowest twelve bits are zero. Those bits can carry an index, provided the block's capacity and boundary state fit within the available space. Masking them off recovers the address; applying the index mask recovers the position.

In the current implementation, each logical block occupies one system base page and uses that page's alignment. The number of slots depends on how many fit in the page for the element type. The queue computes and retains the masks needed to [encode and decode its heads][head], so every accessor uses the same geometry.

Several logical blocks can share a larger allocation through a [`BlockRun`][blocks]. Each block in the run holds an implicit reference to that allocation, and releasing the final block returns the whole run to the allocator. The logical blocks retain their page alignment, so packing continues to work while allocation ownership spans several blocks.

The useful consequence is that a single atomic load returns an address and index from the same head state. A reservation can also compare and update the combined representation in one operation. This removes the need to coordinate two separately stored fields for that particular state transition.

## My contribution and current work

My contribution centers on packing the block address and index into a single atomic representation, building on the separate state used by `SegQueue`. UBQ gives me a way to investigate that change in a working queue, including the coordination needed at block boundaries and during memory reuse.

Benchmarking and performance analysis are ongoing. The results are still preliminary, and I want to present them with the workload, hardware, implementation revisions, and limitations that make a comparison meaningful. The compact head gives a concrete mechanism to inspect; its performance and the correctness of the surrounding protocol each need their own evidence.

<!-- Editorial note: Benchmark results remain deferred, as confirmed in this round. Keep performance figures and a stronger CV claim pending a reviewed result; do not ask for a finished comparison again until that work is ready. Retain the measured code revision alongside any future result, even if the implementation has since changed.
-->

This account refers to [UBQ revision `b8fce0a`][revision].

[bbq]: https://www.usenix.org/conference/atc22/presentation/wang-jiawei
[segqueue]: https://github.com/crossbeam-rs/crossbeam/blob/crossbeam-queue-0.3.12/crossbeam-queue/src/seg_queue.rs
[head]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/head.rs
[blocks]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/block.rs
[revision]: https://github.com/Orkking2/UBQ/commit/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2
