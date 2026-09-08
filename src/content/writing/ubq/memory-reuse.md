---
title: 'Completing and reusing UBQ blocks'
summary: 'How completed slots are counted and how standalone blocks and allocation runs are released.'
order: 4
inProgress: true
---

## Completing and reusing a block

Each block holds a [`consumed` atomic counter][blocks] that records completed slots. In the ordinary batch path, an iterator accumulates its completions locally and updates that counter when it reaches a block boundary or exhausts its reservation. The shared counter therefore receives one update for the completed segment, rather than an update for every item.

The consumer whose update brings the counter to the block's capacity becomes responsible for releasing that block. When continuing into another block, the [iterator loads the successor][implementation] before reporting the old block's completed segment. An exhausted reservation does not access the old block again. Both paths avoid reading a block after the completion update may have released it.

Release takes two forms in the current implementation. A standalone block is reset and offered to the queue's single cached-block slot. If that slot is already occupied, the block is freed; if it is retained, a later producer can reuse it. A block belonging to a `BlockRun` is released without entering that cache, because retaining one member would keep the whole allocation alive. The underlying allocation is returned only when the run's final block has been released.

This is why reaching the end of a block and returning its memory to the allocator are separate events. The packed head identifies a position, while completion accounting and allocation ownership determine when its storage can be reused or released.

<!-- Editorial note: In two or three sentences, explain the design constraint that led you to retain one standalone block for reuse. Keep the full correctness argument and benchmark results pending. Response: -->

This account refers to [UBQ revision `b8fce0a`][revision].

[implementation]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/queue.rs
[blocks]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/block.rs
[revision]: https://github.com/Orkking2/UBQ/commit/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2
