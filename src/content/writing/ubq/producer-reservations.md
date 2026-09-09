---
title: 'Reserving producer slots in UBQ'
summary: 'The producer’s compare-and-swap reservation and its responsibility at a block boundary.'
inProgress: true
published: '2026-09-04'
updated: '2026-09-08'
---

## Reserving a producer slot

Consider an ordinary single-value push into an initialized block with space remaining. The producer loads the packed head, extracts the index, checks that it is within the block, and prepares a new head with the index advanced by one. It then attempts a compare-and-swap, or CAS, against the complete packed word, as shown in the [producer reservation code][implementation].

If the comparison succeeds, the producer has reserved the slot described by the old head. If it fails, the producer uses the returned head value and retries. Although the position calculation concerns the index, the atomic comparison includes the address as well. Another thread's update cannot leave this reservation with an index taken from one head state and an address taken from another independently loaded field.

Reservation and publication are separate steps. After claiming a slot, the producer writes its value and publishes the slot's written state. The consumer waits for that state before reading the value. UBQ uses [release and acquire operations on the slot state][slots] to establish this ordering.

## At a block boundary

Suppose one producer reserves the final slot in a block. Its successful CAS leaves the producer head's index at the block's capacity. A second producer arriving at that point observes the full-block state, waits according to its [backoff policy][backoff], and reloads the head. It cannot reserve another slot from that block.

The producer that claimed the final slot is responsible for ensuring that the successor is linked and publishing a head that points into it. Once that head is available, the second producer can try to reserve a slot there. In the current single-value push path, this head transition happens before the first producer writes its own value. The slot-publication protocol still determines when a consumer may read that value.

This is an interval of exclusive responsibility. If the producer handling the transition stops making progress, later producers reaching that boundary must wait for it. The use of atomic operations does not remove this dependency or, by itself, establish a lock-free progress guarantee for the complete queue operation.

<!-- Editorial note: This revision replaces the earlier fetch-and-add account with the inspected compare-and-swap implementation. The boundary still depends on the producer responsible for advancing the head; the old “Without Locks” title is not a progress guarantee. -->

This account refers to [UBQ revision `b8fce0a`][revision].

[implementation]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/queue.rs
[slots]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/slot.rs
[backoff]: https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/backoff.rs
[revision]: https://github.com/Orkking2/UBQ/commit/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2
