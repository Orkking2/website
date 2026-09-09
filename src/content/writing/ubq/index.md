---
title: 'UBQ'
summary: 'Writing about the Unbounded Block-based Queue.'
status: In development
links:
  {
    paper: null,
    code: 'https://github.com/Orkking2/ubq',
    docs: 'https://docs.rs/crate/ubq/latest',
    demo: null
  }
---

UBQ, standing for Unbounded Block-based Queue, is my first voyage into the realm of unbounded MPMC (multi-producer, multi-consumer) FIFO (first-in, first-out) queues. It is a way for several threads to hand values to one another: producers add values, consumers remove them, and the queue coordinates access to the storage they share.

<Entries from="/writing/ubq" />

<Notice title="Coming soon">

I’m developing the accompanying account of:

- The consumer’s reservation path.
- Benchmarks with the workload, hardware, comparison queues, and limitations stated alongside the results.
- A complete correctness argument, including safe memory reuse, and a paper or preprint.

</Notice>
