---
title: CV
eyebrow: CV
headline: My various experiences.
summary: 'A hub to see the experiences that define my career.'
---

## Education

### University of California, Santa Barbara

Mathematics, B.S. and Data Science, B.S.  
Expected graduation: 2027  
GPA: 3.64

## Academic experience

### ArchLab

Member · Fall 2025–present

**Cookout.** A research project exploring communication pipelines with stages running on accelerators and threads. I extended BBQ to support transformation stages within a shared queue, allowing the pipeline to avoid separate MPMC queues between stages while preserving strict FIFO order.

An illustrative pipeline takes a job request through deserialization, decompression, and routing to a server. My extension lets the same queue blocks hold the different representations used by those stages, so a change in representation does not require another set of queue blocks.

**Pengwing.** A research project exploring a blended operating-system model in which accelerator work, user-space tasks, and kernel tasks can interact through shared-buffer queues. I created a Rust API using procedural macros to express inline configuration through a custom syntax.

### BSC-CNS

Visitor (internship) · July 15–September 15, 2026 (expected end)

Computer Sciences — High-Performance Algorithms and Hardware Accelerators for Bioinformatics.

- Implemented [`nosv`, a Rust asynchronous task runtime](https://github.com/Orkking2/nosv), on top of [nOS-V](https://github.com/bsc-pm/nos-v), allowing those tasks to participate in scheduling across cooperating user-space processes.
- Implemented an I/O driver using `io_uring` to submit operations and wake waiting asynchronous tasks when those operations complete.

The repository's [TCP example](https://github.com/Orkking2/nosv/blob/8964c3f1faa082e5df8153ae879417c1eb49400e/examples/net_io_poc.rs) gives each accepted connection its own task. That task awaits a request, converts the payload to uppercase, and awaits sending the response while other connections can progress. The [I/O operation future](https://github.com/Orkking2/nosv/blob/8964c3f1faa082e5df8153ae879417c1eb49400e/src/io.rs) registers the task's waker and returns `Pending` while the operation is incomplete; completion makes the result available and wakes the waiting task.

I ended up on nOS-V somewhat sideways: it was originally assigned to a previous intern, who was supposed to connect AWS's Firecracker to nOS-V. They obviously did not succeed and so an easier version was passed to me, which I attempted to faithfully implement. This runtime is what grew out of that dead end, with the io_uring driver specifically following from hearing that a colleague's peer had built. He had, with the nOS-V native C API, built a similar polling task for async I/O. The main constraint was that nOS-V has no native concept of a future, so implementing one meant researching and understanding thoroughly the Rust future API, and how it was implemented under the hood with VTables and function pointers. I built my io_uring driver on top of my future-aware runtime, rather than cloning the previously mentioned peer's work (I have to this day not seen this work either).

## Research projects

### UBQ — Unbounded Block-based Queue

In development

My first research project: an unbounded multi-producer, multi-consumer FIFO queue implemented in Rust.

My contribution centers on packing a block address and slot index into one pointer-width atomic per queue head. Performance evaluation is ongoing.

The [UBQ writing collection](/writing/ubq) collects articles on the design and its relationship to prior work. The [source repository](https://github.com/Orkking2/ubq) contains the implementation.

### LUBQ — Linked UBQ

In development

A continuation of UBQ that distributes producers across several single-producer, multi-consumer (SPMC) queues. Each producer has its own queue, preserving that producer's sequence without enforcing one global FIFO order across producers.

If producer A enqueues a value before producer B enqueues another, a consumer visiting B's queue can return B's value first. This differs from UBQ's single queue order. The [LUBQ implementation](https://github.com/Orkking2/UBQ/blob/b8fce0a5f6cb176ccce9195ba90e0fa4731222e2/src/kfifo/lubq.rs) contains the sender and receiver operations.

<!-- Editorial note: The supplied example now explains the ordering directly. Use "per-producer FIFO" for this account; a numerical kFIFO relaxation bound has not been established here. Revisit the terminology only when that bound has a precise definition and supporting argument.
-->

## Manuscripts

- **UBQ: An Unbounded Block-Based Concurrent Queue.** First author. In progress; unpublished.
- **Enhancing Accelerator Communication Patterns** (Cookout). Second author. In progress; unpublished.
- **A Blended OS to Reshape the HW-SW System Stack** (Pengwing). Contributing author. In progress; unpublished.

<Notice title="Coming soon">

I'm expanding this record with:

- A downloadable PDF of this CV.

</Notice>
