---
title: The Beginning
summary: Changes to batching and block management that prompted UBQ V8.
---

V8 is in development. The first change described here is finished; the rest of the article records directions I am investigating, written while the work is in progress rather than after it settles.

Several discoveries during the development of UBQ prompted me to begin V8. The first concerned how UBQ reported consumption during batch operations. Each block has a counter, `consumed`, that tells other threads how many of its slots have been consumed. This counter helps determine when the block can be freed. Freeing it while consumers are still accessing it would cause a use-after-free (UAF) memory error. With the help of AI, I identified the repeated counter updates as a bottleneck.

Instead of incrementing the counter after every slot, I changed UBQ to accumulate the count locally and update the counter when the batch finishes its portion of a block. Consider this queue:

<Figure src="./UBQ Visualization.svg" alt="A queue block with three consumed slots, four being consumed, and three published slots." />

The block is in the middle of a transition. The first three slots have been consumed, the next four are being consumed, and the final three have been published. Previously, UBQ would increment `consumed` once for each of those four slots. That meant repeatedly updating the same atomic even though the reservation had already established how many slots the consumer would process.

The change lets the consumer finish those four slots and increment `consumed` by four. The update occurs when the consumer reaches the end of the block or its reservation, so a batch spanning several blocks updates each block separately.[^implementation]

This provided a performance improvement, but it also changed the L1 data cache (L1D) miss rate. My interpretation is that repeatedly modifying the same word in a tight loop had increased the proportion of cache hits. Removing those accesses could therefore raise the miss rate even while reducing the work performed.

After making this change, I realized that consumption was not the only per-slot update in batched operations. UBQ also inherits per-slot publication from Crossbeam's SegQueue, the queue on which its implementation is based. Every slot in the figure contains an 8-bit state atomic. The producer writes the slot's `value` field, then updates its state to make the value available to consumers.[^implementation] That leaves one publication update per slot even when the producer is writing a batch.

In V8, I hope to investigate using a per-block `published` counter instead of a per-slot atomic. The shape I have in mind comes from BBQ, which keeps its bookkeeping in a few counters on each block rather than in state on each slot: two on the producer side, counting the slots reserved and the slots published, and two on the consumer side, counting the slots reserved and the slots consumed. Those are raw counts, so a batch can advance one of them by its whole length instead of one slot at a time.

The protocol is not settled. A per-block counter has to answer something a per-slot atomic answers implicitly. When producers reserve within the same block and finish out of order, a count of published slots is not the same as the length of a contiguous published prefix, and a consumer needs one of the two to know which slots it may read. I have not chosen between them.

## Page faults

Another part of V8's design concerns minor page faults as the queue grows and refills. UBQ already caches a single standalone block, and [LUBQ](/writing/lubq) retains fully consumed blocks in a pool for each producer's queue; that pool is checked before a new block is allocated, allowing later batches to reuse the blocks needed at peak utilization.[^implementation] I want to investigate whether a free list in V8 could help reduce page faults on refill.

The structure I have in mind is shared by every thread rather than kept per producer or limited to one cached block. It is a single atomic pointer holding the head of a chain of free blocks, null, or a sentinel marking the list as reserved. A thread that wants blocks reads the pointer, gives up if it is null, and otherwise tries to compare-and-swap the sentinel into place. Success hands it the entire chain: it removes the blocks it needs and compare-and-swaps the remainder back. A thread returning blocks points the tail of its own chain at the head the pointer currently holds, then compare-and-swaps the head of that chain into the pointer. In both directions, only one thread modifies the list at a time.

That is a primitive arrangement, and I am choosing it for its simplicity. A block covers many slots, so I expect the cost of an exchange to amortize across all of them.

## Block sizing

UBQ's [packed-head design](/writing/ubq/head-packing), which combines a block address and slot index in one atomic, constrains block sizing. The current design uses one block size for a queue, while batch sizes can vary at runtime.[^implementation] Small blocks can require frequent trips through the allocation path. Large blocks may lose some of the benefit of block-level isolation: the separation that [BBQ, the Block-based Bounded Queue](https://www.usenix.org/conference/atc22/presentation/wang-jiawei) creates by dividing one large allocation into smaller logical blocks.

BBQ's argument for that division is about which pairs of threads contend. Concurrent queue designs have worked to remove producer-producer and consumer-consumer contention while leaving producer-consumer contention in place. Dividing the allocation separates the two ends of the queue: so long as producers and consumers are working in different blocks, a consumer never touches an atomic a producer is modifying. The paper reports measurements supporting that separation.

Block size decides how often the separation holds. Larger blocks place the two ends in the same block more often, which restores the contention the division was meant to remove, while smaller blocks return to the allocation path more often.

UBQ cannot rely on BBQ's single allocation in the same way, because its blocks can be freed. Consider SegQueue's separate atomic address and index. A thread can load a block pointer and then be preempted. While it is paused, another thread may advance the queue far enough to free that block. Loading the pointer alone does not establish that the thread can safely access it; the reservation protocol must also establish ownership of the slots it will consume.

UBQ combines the address and index in a single atomic. A reservation that modifies the index therefore also obtains the corresponding address. SegQueue must coordinate its separate address and index atomics, while UBQ updates the pair together. The tradeoff is the space available for other information. A modified SegQueue design could encode block size alongside the index in its separate index word, allowing blocks of different sizes. UBQ's packed representation leaves less room for that information.

## A new operation

If a 128-bit atomic could operate at the same speed as the 64-bit atomics used by UBQ, it could provide more room for block-sizing information while keeping the address and index together. I want to investigate a more specific operation: one that modifies only the lower 64 bits on its fast path, but returns the full 128-bit state atomically.

This atomic would need the following capabilities:

- Load 128 bits, including the address and index, in a single atomic operation.
- Perform a read-modify-write (RMW) operation on the lower 64 bits while returning the full 128-bit state atomically.
- Store 128 bits in a single atomic operation.

These are the operations I want to explore as a basis for a UBQ design with dynamically sized blocks. This is the least settled part of V8: I have not identified the instructions or the target machines the comparison would rest on, so I have no measurement of what such an operation would cost next to the 64-bit atomics UBQ uses now, and no account yet of what a wider head would have to encode beyond the bits it makes available.

[^implementation]: Implementation references at UBQ commit [`45362dd`](https://github.com/Orkking2/ubq/tree/45362dd405ab470b7f11b9e40a71ad36e286cfb3): [`UBQIter` and the block pool](https://github.com/Orkking2/ubq/blob/45362dd405ab470b7f11b9e40a71ad36e286cfb3/src/queue.rs), [slot publication](https://github.com/Orkking2/ubq/blob/45362dd405ab470b7f11b9e40a71ad36e286cfb3/src/slot.rs), [LUBQ's per-producer queue and block cache](https://github.com/Orkking2/ubq/blob/45362dd405ab470b7f11b9e40a71ad36e286cfb3/src/kfifo/queue.rs), and [packed-head geometry](https://github.com/Orkking2/ubq/blob/45362dd405ab470b7f11b9e40a71ad36e286cfb3/src/head.rs).

