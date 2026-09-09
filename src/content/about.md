---
title: About Me
eyebrow: About Me
headline: Me
summary: "I'm Nicolas, a mathematics and data science student at the University of California, Santa Barbara. This site collects my investigations into efficient algorithms, the writing that grows out of them, and my photography."
cover: photo-b35fd29488de
---

## Why this site exists

I designed and crafted this website to give my work and discoveries a place of their own. My first voyage into academic research, [UBQ](/writing/ubq), showed me the rigor required to turn an idea into a finding that others can inspect and trust. There is, unfortunately, quite a distance between the founding of an idea and its widespread adoption. With even the most move-fast-and-break-things software, like what is happening currently in the AI space, and what has happened previously in the tech space in the information age, there is always a requirement for establishing contributions. It is not enough to say: "Here I have a novel algorithm that I believe is the best." This establishment of concrete evidence is definitely necessary, because it eliminates poorly performing ideas, but can stifle ingenuity, forcing a refocus from creativity and development onto testing and benchmarking.

An example of the benefit of rigor is with my huge-page experiment for UBQ. I attempted to use huge-pages, which I figured would be an efficient way to allocate large swaths of memory, to back UBQ, so as to decrease allocator pressure. This backfired for two reasons: firstly, the mechanism for allocation is incredibly optimized in the general case and simply is not as optimized for huge-pages, and secondly the platform I use to benchmark my queues, the supercomputers at BSC-CNS, do not support huge pages because there is simply too much fragmentation that happens. In this case, rigor provided more insight and was worth the work, and perhaps most rigor is this way, but certainly not all of it is.

Without rigor, claims cannot be verified, and can more generally not be trusted. That said, the discussion of ideas does not need the same level of rigor as an academic paper. I can discuss here thoughts, trials, and tribulations that I have not verified, that I have not even implemented. I can write about the huge-pages experiment like I describe above, where what seemed like a good idea turned out to not be so good in the end. I intend these pages to offer an insight into my mind and work as I continue these investigations, and the account can grow with my understanding, preserving the reasoning and the revisions that brought it there.

## Background and work

I study mathematics and data science at UC Santa Barbara, in the class of 2027. I have been a member of ArchLab since fall 2025, working on queue-based communication and a Rust configuration API for research projects. During my summer internship as a visitor at BSC-CNS, I implemented an asynchronous task runtime and an I/O driver. My [CV](/cv) collects the project contributions, education record, work on manuscripts, and most all other information pertaining to my career.

UBQ is my initial research project, concerned with unbounded queues shared by multiple producer and consumer threads. The [UBQ collection](/writing/ubq) brings together my writing on its interface, shared state, and coordination.

## Photography

[Photography](/photography) has a place here alongside the technical work. I often keep a photograph because I find it visually interesting or memorable: something I want to look back on and remember a time or a moment. I also have large collections from museum visits, where there is so much that catches my attention. Those photographs can be harder to write about, even when I know why I wanted to keep the image.

One photograph, “Worn with time,” shows a man's face on a tombstone, its features smoothed by the passage of feet. I found it particularly interesting because it makes a gradual process visible: the accumulated wear of an act as ordinary as walking. Repair and replacement often remove that record before it can be noticed. Here, the worn surface made me think about how much of an object's history we obscure by continually renewing the things around us; read more [here](/writing/photography/worn-with-time).

I want to give selected photographs room for that context. Sometimes a short observation is enough; sometimes an accompanying essay may give a fuller account of where, when, or why I made the photograph.

## Contact

- Email: [author@nebve.com](mailto:author@nebve.com)
- GitHub: [Orkking2](https://github.com/Orkking2)
