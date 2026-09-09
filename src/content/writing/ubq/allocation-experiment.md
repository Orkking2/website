---
title: 'An allocation experiment in UBQ'
summary: 'An account of the allocation experiment and what the current profiler measures.'
inProgress: true
---

## An allocation experiment

I experimented with huge-page backing for UBQ's blocks. In my local tests, the experimental `mmap` allocation path was slower than the ordinary Rust global-allocator path. I also could not obtain the huge pages needed for a comparison on the benchmark machines available to me. The implementation gave me something to investigate, but those conditions left its effect on queue throughput unresolved.

A larger allocation and huge-page backing are separate choices. The current [`BlockRun` implementation][blocks] can divide one allocation into several logical blocks; that alone does not establish that the allocation is backed by huge pages. The experiment needs to distinguish the cost of obtaining memory from the cost of using it once the queue is running.

The current [handoff profiler][profiling] starts its timer after worker setup and releases producers and consumers to operate on the queue. Any block allocation triggered by those operations falls within the measured interval. Calibration and warmup rounds are accounted for separately and can leave reusable storage behind, so the measured round does not isolate allocation latency.

The [current block allocator][blocks] uses the [system's base-page size][page-size] and the ordinary allocator; it does not explicitly request huge-page backing. These details establish what the current code does. The earlier huge-page experiment still needs its own configuration record before I can attach a timing comparison to this account.

<!-- Editorial note: Source inspection answered the current timing and allocation questions. The earlier mmap/huge-page experiment's configuration and verified page backing were not identified in the inspected source or source history, so keep that account as a qualitative observation. Do not repeat the request for implementation details Nicolas has already referred to the source.
-->

This account refers to [UBQ revision `b8fce0a`][revision].

[blocks]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/block.rs
[profiling]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/bench_harness/mod.rs
[page-size]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/page.rs
[revision]: https://github.com/Orkking2/UBQ/commit/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2
