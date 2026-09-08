## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: eslint, prettier

---

# AGENTS.md

## Scope and authority

This file is the working brief for agents building Nicolas's personal website at `nebve.com`. It applies to the entire website repository unless a more specific `AGENTS.md` is added below a subdirectory.

Treat Nicolas as the product owner, creative director, author, and final editor. Treat this document as the approved planning baseline, not as permission to invent personal content or settle unresolved visual decisions. When a later, explicit instruction from Nicolas conflicts with this file, follow the later instruction and update this brief if the change is intended to persist.

This information architecture began as course planning for a formal website proposal. The original assignment asks the sitemap to demonstrate at least seven branching or interconnected pathways; the graph in this file exceeds that minimum. Nicolas already has a minimalist, communicative draw.io version of the sitemap outside this workspace. If that diagram is supplied later, reconcile it with the route model and keep both representations synchronized rather than silently replacing it.

## Project in one sentence

Build a long-lived personal website that combines Nicolas's professional and research portfolio, technical writing, photography, and CV in a clear static site generated with SvelteKit, versioned in GitHub, and deployed to `nebve.com` through Cloudflare Workers static assets (see "Hosting platform" below for why this replaced the originally planned Cloudflare Pages).

## Product goals

The site should:

- establish a credible professional web presence for employers, collaborators, and other researchers;
- explain projects—especially UBQ—at several levels of detail;
- provide a durable home for research and technical writing;
- showcase selected photography without turning the entire site into a photography portfolio;
- provide both a web-readable CV and a downloadable PDF;
- grow over time without requiring a database, CMS, or redesign for every new article or project;
- make each visitor's likely next step obvious through concise copy and deliberate cross-linking.

The site is not merely an online résumé. It is a connected record of Nicolas's work, thinking, and photography.

## Confirmed baseline and tentative decisions

### Confirmed baseline

- Public domain: `nebve.com`, already registered and managed through Cloudflare.
- Framework: SvelteKit.
- Rendering: fully prerendered/static output.
- Hosting: Cloudflare Workers, configured for static assets only (no Worker script, no dynamic backend). See "Hosting platform" immediately below.
- Repository and content source of truth: GitHub.
- Primary navigation: About Me, Writing, Photography, and CV (unified on 2026-09-08).

### Hosting platform: Cloudflare Workers static assets, not Pages

This project originally targeted Cloudflare Pages. While connecting deployment (2026-09-05), two things became clear: Cloudflare's dashboard now defaults new "Workers & Pages" project creation to a Git-connected Worker rather than classic Pages, and Cloudflare's own documentation states plainly that Workers, not Pages, is "Cloudflare's primary platform for building applications" going forward.

Cloudflare Workers now serve static assets natively — a Worker configured with an `assets` block and no `main` script entrypoint is, for this project's purposes, architecturally identical to what Pages provided: the exact same prerendered `build` output, served with no server-side code, no cold start, and no CPU billing, because requests never reach a Worker script at all. Nothing about this reintroduces a backend, a Function, or dynamic logic — `wrangler.jsonc` in this repository deliberately has no `main` field. The "do not add a Cloudflare Function/Worker...without approval" rule below is about avoiding dynamic backend logic, not about which Cloudflare product name serves static files; it remains in force for anything with a `main` script.

Practical consequences:

- Configuration lives in a committed `wrangler.jsonc` (`assets.directory: "./build"`, `assets.not_found_handling: "404-page"` so the real `build/404.html` is served rather than an SPA fallback) instead of a Pages project's build-output-directory setting.
- The Cloudflare dashboard's deploy command for this project is `npx wrangler deploy`, not a Pages-style static publish.
- Custom-domain attachment uses the Workers custom-domains flow (Settings → Domains & Routes → Add → Custom Domain), not Pages' custom-domain workflow.
- `_headers` and `_redirects` in `static/` are still honored the same way they were under Pages.
- Home is reached through Nicolas's name or site mark; it does not need a sixth primary-navigation item.
- Photography contains a gallery and photo essays.
- The CV exists as readable HTML plus a downloadable PDF.
- UBQ is the initial featured research project and links to its overview, paper/preprint, code or repository, docs.rs documentation, and related writing.
- UBQ articles live in `src/content/writing/ubq/`; its `index.md` gives a brief introduction and lists the focused articles. LUBQ follows the same pattern in `writing/lubq/`. A project does not need a separate monolithic overview.
- Photo essays live canonically in `src/content/writing/photography/` and are also listed from the Photography gallery; do not create duplicate copies.
- The authoritative voice and identity standard is `docs/voice-and-identity.md`, approved by Nicolas on 2026-09-04.
- The site identity is a plain lowercase `nebve.com` in Times New Roman at the top left, with a lowercase `n` favicon. Nicolas's full identity is concentrated on About Me and CV.
- Every non-code word uses the system Times New Roman stack; code uses monospace. The visual foundation is absolute black, near-white text, and a lime interaction state. Exact supporting token values require prototype review.
- Home is an index rather than a giant hero. Articles support a collapsible annotation rail; photography uses a filterless mixed-aspect grid and a pinned-image, advancing-text treatment for photo essays.
- Markdown-compatible authored files are the target content source of truth. Use ordinary Markdown by default and native Svelte components for content that genuinely needs custom logic.
- Nicolas supplies creative direction, content, photographs, professional facts, and final editorial approval. Agents implement the infrastructure and feature set.

### Tentative or future-facing choices

- **Project Archive** is Nicolas's working label; **Other Projects** is a suggested alternative. Confirm the visible label before launch. Do not publish an empty collection or fabricate entries. This area can evolve into Featured Projects plus a Project Archive when enough work exists.
- TypeScript is a recommended implementation default if no repository convention exists, but Nicolas has not made it a product requirement.
- The About Me substructure—Biography / Background, Experience, and Contact + External Links—is a useful working model, not an immutable final division.
- Exact secondary color values, typographic metrics, interaction motion, gallery spacing, annotation geometry, and photo-essay responsive behavior remain prototype gates. Do not silently turn trial values into permanent tokens.
- Research notes, tutorials, shorter notes, RSS, search, analytics, and a more formal project archive are possible future additions, not MVP requirements.
- The route examples and content fields in this file are recommended defaults. Preserve their information relationships even if implementation details change.

Escalate a tentative choice to Nicolas before making it a visible brand or editorial commitment.

## Visitor conversations

Use Torrey Podmajersky's content-first idea that an interface is a conversation. Every important page should anticipate what a visitor is asking and give a direct answer or next step.

| Visitor                        | Likely question                                                      | Intended path                                                   |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Employer or collaborator       | Who is Nicolas, what can he do, and where is the evidence?           | Home → About Me or Writing → CV or Contact                      |
| Researcher or technical reader | What is UBQ, what did Nicolas contribute, and where are the details? | Home → Writing → UBQ → Articles, Paper, Code, or docs.rs        |
| Reader                         | What is Nicolas researching or learning?                             | Home or Writing → Article → Related Project or Related Articles |
| General or creative visitor    | What does Nicolas make and care about beyond technical work?         | Home → Photography → Gallery or Photo Essay                     |

Keep important destinations within roughly three clicks of Home. Use familiar link labels that describe the destination; avoid clever labels that make visitors guess.

## Information architecture

```text
Home
├── About Me
│   ├── Biography / Background
│   ├── Experience → CV
│   └── Contact + External Links
├── Writing
│   ├── UBQ → Interface, Head Packing, Producer Reservations, Memory Reuse, Allocation
│   │   └── Paper / Preprint, Code / Repository, docs.rs Documentation
│   ├── LUBQ → Per-producer Ordering
│   ├── Photo Essays → Individual Essay Pages
│   └── Other collections or standalone articles as authored
├── Photography
│   ├── Gallery → Shareable photograph viewer
│   └── Photo Essays → Canonical Writing pages
└── CV
    ├── Web-readable CV / Résumé
    └── Downloadable PDF

Site mark → Home; footer → primary sections and approved external links
```

### Required cross-links

The sitemap is a graph, not only a directory tree.

```text
Writing → Project collection → Focused article → Collection reading list
                                ↔ Explicit related articles
Photography → Photo essays ← Writing
About experience → CV → Relevant writing
```

- Directory membership supplies a collection and its reading list. `<Entries from="/writing" grouped />` lists each child directory’s articles under its heading.
- An article has one canonical file. Existing validated `related` paths and explicit `<Entry from="…" />` links can connect collections without duplicating prose. A richer multiple-membership system is deferred.
- A collection index is a brief orientation and a list, with external resources when relevant. Articles can be dated or evolving accounts; no long overview is mandatory.
- Cross-links come from validated metadata or explicit catalog references, not repeated titles and summaries.

## Page and content requirements

### Home

The homepage should orient visitors rather than reproduce every page. Current hierarchy:

1. a short introduction of roughly two or three sentences;
2. featured research or projects, with UBQ prominent;
3. recent or featured writing;
4. selected photography in a visually distinct preview;
5. a short About/Contact path.

Do not make a full-screen photograph the site's only identity. Do not add a giant hero animation, novelty cursor, intro gate, or other attention-heavy portfolio convention without Nicolas's approval.

### About Me

The current working structure is Biography / Background, a concise Experience summary, and Contact + External Links. Confirm it as the content develops. The Experience material should preview rather than duplicate the complete CV. Never invent biographical facts, employers, dates, achievements, contact details, or profile URLs.

### Project writing collections

Project summaries should answer: What is it? Why does it matter? What was Nicolas's role or contribution? Where can a visitor go deeper?

The UBQ collection and its focused articles together should support:

- a plain-language project overview before low-level detail;
- a paper or preprint link;
- a source-code or repository link;
- a docs.rs link;
- related writing, ordered deliberately or by publication date;
- optional figures, benchmarks, or technical details only when supplied and contextualized.

Do not infer what “UBQ” expands to, claim performance results, or describe Nicolas's contribution beyond supplied source material.

### Writing

Writing holds project collections, photo essays, and standalone articles. Current and planned technical topics include:

- “Reserving producer slots in UBQ”;
- “Benchmarking an Unbounded MPMC Queue on Arm”;
- “Memory Reclamation”;
- “Contention and Block-Based Queues”;
- “Head Packing.”

These are planned topics, not claims that finished drafts exist. Articles should use clear, direct titles and support code, figures, citations, footnotes, and accessible tables where needed. Future content types may distinguish polished articles, research notes, and tutorials, but do not build a complicated taxonomy before the content requires it.

### Photography

Keep this section focused: a selected gallery plus photo essays. A photo essay may be a sequence of photographs with short contextual passages or even one photograph with a concise account of where, when, or why it was made. It need not be long-form prose.

- Give every image an `alt` attribute: useful alternative text for a meaningful photograph, or `alt=""` for a truly decorative image. An adjacent description may supplement but does not replace the attribute.
- Allow distinct captions and longer context; do not force one field to serve all three purposes.
- Preserve aspect ratios and avoid destructive crops unless Nicolas approves them.
- Strip embedded EXIF location data from every published asset. A reviewed photo record may
  separately include exact latitude and longitude when Nicolas explicitly enables them for that
  image; present approved coordinates behind a keyboard-, focus-, click-, and touch-accessible
  information disclosure rather than hover alone. This stricter rule is specific to exact
  coordinates. Ordinary captions and approved location labels appear below each photograph;
  the earlier `i` disclosure is retired as of 2026-09-08.
- A selected photograph must retain a reviewed capture date and time. Order the main gallery by
  capture date and time, newest first; photo-essay sequencing remains editorial. The exact
  timestamp is not displayed in the gallery UI — it stays in the photo record.
- Nicolas chooses the photographs and approves their captions, crops, metadata, and presentation.

### CV

Provide a fast, readable HTML version and an obvious PDF download. Reuse structured experience data where sensible so About and CV facts do not drift, while treating the PDF as a separately reviewed artifact. The PDF must not be the only accessible version.

## Route model

Routes are not written by hand. The tree under `src/content/` is the site: a Markdown
file is a page, a directory is a page with children, and `index.md` is what a directory
serves at its own path — the same relationship `index.html` has to a directory of a
site. One route, `src/routes/[...path]`, prerenders all of them.

```text
src/content/index.md                     →  /
src/content/about.md                     →  /about
src/content/writing/index.md             →  /writing
src/content/writing/ubq/index.md         →  /writing/ubq
src/content/writing/ubq/head-packing.md  →  /writing/ubq/head-packing
src/content/writing/lubq/index.md        →  /writing/lubq
src/content/photography/index.md         →  /photography
src/content/writing/photography/worn-with-time.md → /writing/photography/worn-with-time
src/content/cv.md                        →  /cv
```

A name beginning with `.` or `_` is not part of the tree, which is how the photograph
library lives at `src/content/photography/.photogrid/` without becoming a page.

Use clean, stable, lowercase slugs. If a route changes after publication, preserve inbound links with a redirect via `static/_redirects`, which Cloudflare Workers static assets honors the same way Pages did. External paper, code, docs.rs, and PDF links must remain real links rather than being disguised as interface buttons without link semantics.

## Technical architecture

### Required architecture

```text
Markdown, structured data, images, and Svelte code
                         │
                         ▼
                  Git commit / pull request
                         │
                         ▼
                       GitHub
                         │
                         ▼
        Cloudflare Workers build + preview
              (static assets only)
                         │
                         ▼
             SvelteKit prerendered static files
                         │
                         ▼
                     nebve.com
```

- Use `@sveltejs/adapter-static` and prerender the site to a static output directory, normally `build`.
- Export `prerender = true` from the root layout and keep server-side rendering enabled during the build; do not turn the site into a client-only SPA.
- Ensure every dynamic `[slug]` route is discoverable during prerendering through generated `entries`, reachable listing links, or another verified mechanism. Authored content must not disappear from `build`.
- Provide a real top-level `build/404.html`, not an SPA fallback, and verify it with an unknown URL.
- A visitor request must not require a database query or an application server.
- The GitHub repository is the content store and source of truth, not a runtime database.
- Do not add a CMS, database, authentication system, backend API, or runtime content fetch without a concrete requirement and Nicolas's approval. This includes a Worker `main` script with dynamic logic — the static-assets-only Worker configured in `wrangler.jsonc` (see "Hosting platform" above) is the one approved exception, since it has no script and serves only the prerendered `build` output.
- Prefer build-time content loading and static HTML. Hydrate only components that genuinely need client-side behavior.
- Follow the existing lockfile and repository conventions once the project exists. Keep dependencies few, maintained, and justified.

### Suggested repository shape

Adapt this structure to current SvelteKit conventions rather than reproducing it mechanically:

```text
src/
├── content/                 # the page tree; a file is a page, index.md serves its directory
│   ├── index.md
│   ├── about.md
│   ├── cv.md
│   ├── writing/             # project collections and photo essays
│   └── photography/
│       └── .photogrid/      # masters and records; hidden from the page tree
├── lib/
│   ├── components/
│   ├── content/
│   ├── data/
│   ├── styles/
│   └── utilities/
├── routes/
└── app.html

static/
├── images/
├── documents/
├── favicon/
├── robots.txt
└── social/
```

Separate authored content from presentation logic so a redesign does not require rewriting articles. Use Markdown or a Markdown-compatible pipeline for prose; allow Svelte-enhanced content only when a post truly needs an interactive or custom component.

## Content model

Validate content at build time. Required fields should fail the build with a useful message rather than silently rendering a broken page. Do not invent missing values to satisfy a schema.

Every page uses **one schema**, defined in `scripts/content/schema.ts`, with every facet optional. There is no per-type schema and no `slug` or `collection` field: position in `src/content/` is the declaration, so a file's path is its route. `docs/authoring.md` is the authoritative reference for authors; the notes below record the intent behind the shape.

Only `title` and `summary` are required. Beyond those, **a key that is absent does not apply to this page, while a key that is present but empty is unfinished work** and is reported as such. That distinction carries the typing that four separate schemas used to: a page with `published:` is dated, a page with `images:` is a photo essay, a page with `links:` has resources, a page with `status:` is a project.

### A writing entry

```yaml
title: 'Head Packing in UBQ'
summary: 'A concise, supplied description.'
published: YYYY-MM-DD
updated: YYYY-MM-DD # optional; substantive revisions only
tags: [supplied-tag]
related: ['/writing/ubq/head-packing'] # optional links across collections, by path
featured: false
```

### A project

```yaml
title: 'UBQ'
summary: 'A concise, supplied description.'
status: 'supplied-status'
featured: true
tags: [supplied-tag]
links:
  paper: null
  code: null
  docs: null
  demo: null
```

A project is an ordinary directory page: `writing/ubq/index.md` introduces the subject and lists its articles with `<Entries from="/writing/ubq" />`. Project body content may include the problem, context, Nicolas's contribution, approach, results, and next steps, but only when those facts are supplied. Derive collection reading lists from directories; use validated `related` paths for additional links.

### A photo essay

A page that names photographs is a photo essay, wherever it sits in the tree. Each photograph gets a name local to that page, so the essay refers to its own images rather than duplicating photo objects:

```yaml
title: 'Supplied Photo Essay Title'
summary: 'A concise introduction.'
published: YYYY-MM-DD
images:
  tombstone: photo-3b949334809c
cover: tombstone # names one of this page's own photographs
location: null # optional and owner-approved
inProgress: false # optional; true shows an "In progress" marker wherever the essay is listed
```

`<Photo of="tombstone" />` places one where the argument needs it; any photograph left unplaced closes the page in the order it was named.

### The photograph record

The gallery library lives in `src/content/photography/.photogrid/`, hidden from the page tree by its leading dot, and is edited by `npm run photos` rather than by hand. Each record stores the managed asset and its intrinsic dimensions, an optional `title` (burned into the generated image), `alt`, `decorative`, `caption` (displayed below the image), a required capture date and time, an optional timezone offset, an optional owner-approved location label, optional exact coordinates, gallery inclusion, and `reviewed`. Camera metadata is optional and should not be assumed. Gallery order is derived from capture date and time rather than a manual index.

A record does **not** say which essay a photograph belongs to. That link is held once, in the essay's own `images:` map, and the other direction is derived by inverting it.

There is one stage between the library and the site. A photograph is **unfinished** while `reviewed` is false or its data is incomplete, and an unfinished photograph is left out of the build rather than failing it — a library is expected to hold work in progress. Alternative text, or an explicit `decorative` mark, is the one required editorial field, because it is what a screen reader has instead of the photograph; a missing `title` fills itself in as `Untitled`. Marking a photograph reviewed while its data is incomplete _is_ reported, because that claim is untrue.

The same stage governs what is committed (D-024). **Every record is committed; only a ready photograph's master is.** An unfinished master stays untracked, so work in progress costs nothing permanent and curation stays reversible — do not bulk-add `.photogrid/masters/`, and do not treat those untracked files as an oversight to tidy up. When a photograph becomes ready, commit its master with its record. Because of this rule, `readContent()` requires a master to exist only for ready photographs; a check that demanded one for every record would fail the Cloudflare build on a clean clone while passing locally.

### Shared data

Keep approved identity, external-profile, contact, navigation, and CV data in deliberate shared sources. Validate unique slugs, dates, internal references, image paths, and required alternative text. There is no declared draft state: an entry is servable when it is complete, `npm run dev` reports what is still missing and renders anyway, and `npm run build` refuses. Publication is `git push`.

## Design and writing principles

- Follow `docs/voice-and-identity.md` for all public prose, typography, color, imagery, motion, annotation, footnote, photography, and authoring-system decisions.
- Aim for minimalist, communicative, professional, and personal—not generic, sterile, or trend-chasing.
- Let research, writing, photography, and CV feel related through one design system while allowing the gallery to use a more visual layout.
- Use progressive disclosure: summary → detail page → paper, repository, documentation, or deeper article.
- Start with visitor needs and place content where it is canonical; link to it elsewhere instead of duplicating it.
- Write purposefully, concisely, conversationally, and clearly. Preserve Nicolas's voice rather than replacing it with generic portfolio copy.
- Write incomplete-section copy in first person, as Nicolas describing his own unfinished site, not as an agent's checklist addressed to Nicolas. Use a plain "Coming soon" label and bulleted list of what will land there, matching the UBQ reading-path pattern, instead of "not supplied," "still needed," or similar process language.
- Use readable measures and deliberate density. Every non-code word uses the approved Times New Roman system stack. Keep the primary navigation to the four approved sections.
- Design mobile-first and verify layouts at narrow, medium, and wide widths.
- Motion must be restrained, optional, and compatible with `prefers-reduced-motion`.
- Never copy the distinctive visual identity or code of an inspiration site. Extract principles, give attribution where licensing requires it, and create an original site.

## Accessibility requirements

Accessibility is part of the definition of done, not a later polish pass.

- Use semantic `header`, `nav`, `main`, `article`, `section`, and `footer` elements appropriately.
- Include a skip link and a logical heading outline with one clear page-level `h1`.
- Build site navigation from links inside a labeled `nav`; do not apply ARIA `menu` or `menuitem` roles to ordinary site navigation.
- Ensure complete keyboard operation, visible focus, sensible focus order, and no keyboard traps.
- Meet WCAG 2.2 AA contrast expectations for text, controls, focus indicators, and meaningful graphics.
- Do not rely on color, hover, animation, or pointer precision alone to communicate state.
- Supply useful link text, form labels if forms are introduced, and text alternatives for images.
- Preserve zoom, responsive reflow, readable line lengths, and adequate touch targets.
- Test reduced motion, high contrast where practical, screen-reader landmarks/headings, and the site without client-side JavaScript.

## Performance and media requirements

- Favor prerendered HTML and minimal client JavaScript.
- Generate correctly sized responsive image variants at build time; include intrinsic dimensions to prevent layout shift.
- Lazy-load below-the-fold gallery images and prioritize only the true largest-contentful image.
- Use modern image formats where they preserve the intended photographic quality, with a compatible fallback when needed.
- Avoid loading full-resolution originals into thumbnails.
- Subset and self-host fonts when licensing allows, or use a strong system stack; avoid unnecessary font weights.
- Keep third-party scripts out of the critical path. Do not add analytics, embeds, trackers, or cookie banners without approval and a clear need.
- Check Core Web Vitals on representative Home, article, project, gallery, and CV pages, not only an empty shell.

## SEO, discovery, and metadata

- Give every public page a unique title and description.
- Set canonical URLs rooted at `https://nebve.com`.
- Generate `sitemap.xml` and maintain `robots.txt`.
- Provide Open Graph and social-card metadata, with supplied or generated images that respect the visual system.
- Use appropriate structured data where accurate, such as `Person`, `BlogPosting`, or `CreativeWork`; never add unsupported credentials or claims.
- Use real publication and update dates. Do not display fake recency.
- Add an RSS/Atom feed only after Nicolas confirms it or when it is explicitly included in an implementation milestone.

## Privacy, security, and content integrity

- Publish only contact details and external profiles Nicolas has approved.
- Do not expose secrets, unapproved CV data, unpublished papers, high-resolution originals, or sensitive image metadata.
- Treat all prose, project claims, dates, benchmarks, captions, and alt text as editorial content requiring factual support.
- Make external links safe and clearly recognizable. If a link opens a new tab, avoid doing so unnecessarily and include appropriate `rel` attributes.
- Keep dependencies current and audit significant additions. Static generation is a security and maintenance advantage; preserve it unless requirements change.

## GitHub and Cloudflare Workers deployment workflow

1. Author or edit Markdown, structured data, images, and Svelte code locally.
2. Run formatting, type/content checks, tests, and a production build.
3. Commit to Git and push to GitHub.
4. Use a pull request and Cloudflare's preview deployment for meaningful visual or content changes when the repository workflow supports it.
5. Review the preview at mobile and desktop sizes.
6. Merge the approved change to the production branch, expected to be `main` unless the repository says otherwise.
7. Let Cloudflare rebuild and redeploy the Worker's static assets to `nebve.com`.

The expected Cloudflare project settings are the repository's production branch (normally `main`), build command `npm run build`, and deploy command `npx wrangler deploy`, which reads `wrangler.jsonc`'s `assets.directory` (`./build`) rather than a separate build-output-directory field. Cloudflare's dashboard defaults new "Workers & Pages" project creation to a Worker; that is correct for this project, not a mistake to redirect away from. This project deliberately uses `@sveltejs/adapter-static` to produce that `build` directory rather than `@sveltejs/adapter-cloudflare`'s `.svelte-kit/cloudflare` output. Attach `nebve.com` through the Workers custom-domain workflow (Settings → Domains & Routes → Add → Custom Domain). Choose one canonical production hostname, normally `https://nebve.com`, and redirect or otherwise deliberately configure alternate `www` and production `*.workers.dev` hostnames.

Document the exact Node version, package manager, build command, deploy command, Worker/assets configuration, environment variables, and custom-domain steps in the repository README once they exist. No secret should be required merely to build public content. Do not change production DNS or deploy publicly without Nicolas's authorization.

**A passing `npm run quality` is not proof that Cloudflare will build.** It runs against the working tree, which holds untracked files and, on macOS, resolves filenames case-insensitively; Cloudflare builds a clean clone on Linux. A file renamed only by case keeps its old name in git and breaks routes there while looking correct here (this happened to `CV.md` → `cv.md` — see D-024). Before a push that matters, build from a `git worktree` of the commit as the README describes, and record case-only renames with `git mv -f`.

## Agent responsibilities and limits

### Draft collaboration preferences

Nicolas explicitly approved this working preference on 2026-09-06. Carry it into future sessions working in this repository:

- When helping with authored drafts, leave concise, targeted writing prompts in inline HTML comments beside the passage they concern: `<!-- Editorial note: ... Response: ... -->`.
- Ask for a specific piece of writing or evidence, such as two sentences explaining a contribution, one concrete example, or the workload and result supporting a benchmark claim. State the useful scope or length. Prefer these local prompts to repeatedly interrupting the conversation for information that does not block independent work.
- Treat Nicolas's replies inside those comments as supplied source material. Incorporate answered facts into the draft, preserve unresolved information, and replace answered prompts with the next useful question. Do not keep asking for facts already supplied.
- When a reply points to a repository or asks the agent to check the implementation, inspect the source and answer what it establishes before leaving another prompt. Use writing prompts for missing authorial context or decisions, not facts recoverable from available code. Distinguish an unresolved historical experiment from what the current implementation shows.
- If `.local/editorial/context.md` exists, read it before revising drafts. It holds private continuity notes and source material under the Git-ignored local workspace. Respect its disclosure limits; do not copy private context into versionable files, even inside HTML comments, or into generated public assets. Confirm that the local material remains ignored and untracked.
- Preserve Nicolas's voice and revisions. Keep prompts selective, prioritize the next few useful contributions, and distinguish author-facing editorial comments from the site's reader-facing annotation rail and coming-soon copy.
- These prompts support drafting; they do not authorize publication, invented facts, manuscript titles, or broader performance claims. Leave unresolved questions in the file rather than answering them, and remove resolved editorial comments from content being prepared for release.
- For UBQ technical revisions, inspect the latest pushed commit on the source repository's default branch at the start of the pass. Use that code as the current source of truth, then cite the exact inspected commit for reproducibility. Recheck affected prose and links together; neither an earlier website explanation nor unpushed local changes override the latest pushed implementation unless Nicolas explicitly selects a historical comparison.

### Structure and gallery revision, 2026-09-08

Nicolas explicitly approved merging project writing and photo essays into Writing. Keep `/writing` singular to preserve its existing URL. `layout: index` and `layout: article` are retired: ordinary pages share the broad default shell, with centered wider prose and full-width authored sections. `annotations: true` independently enables annotations. The exact measure and spacing remain reviewable prototype values.

Photograph titles are embedded at the top-left of generated variants in the existing outlined watermark treatment, leaving source masters untouched. Captions appear below images, alongside a stable `/photography#photo-ID` link and any `.txt` essay link. Clicking opens the viewer and updates the URL; reload and sharing restore the image, while Back returns to the gallery. Keep a useful anchor and direct image link without JavaScript. Served images, including the direct fallback, are capped at 2400 pixels wide.

Gallery archive navigation and metadata search remain proposals in `docs/gallery-growth.md`, not approved new primary navigation or a search-service dependency.

### Voice flags

Nicolas explicitly approved this working preference on 2026-09-07, after finding published prose that read as AI-generated rather than his own voice — a real risk given the grading criteria some of this content is written for. This is a distinct convention from Editorial notes above: an Editorial note asks Nicolas for a missing fact or decision; a Voice flag marks prose that is factually fine but rhetorically reads as agent-drafted, for Nicolas to rewrite in his own words.

- When a passage leans on a mechanical rhetorical tell rather than genuine authorial voice — most commonly a symmetric three-part list ("an X that did A, a Y that did B, or a Z that did C") or a paragraph that closes on a generalized, aphoristic sentence detached from the concrete technical or personal content above it — wrap it: `<!-- Voice flag: short reason --> ...passage... <!-- /Voice flag -->`.
- Do not flag ordinary careful, hedged, or exact prose just because it is formal — `voice-and-identity.md`'s "Informative" dimension deliberately calls for exactness and hedged claims. The tell is the rhetorical flourish, not the formality.
- Do not rewrite the flagged passage yourself to sound less like AI. A different agent-authored version is still agent-authored; it launders the problem instead of fixing it. Flag it and leave it for Nicolas.
- `npm run content:check` reports every open Voice flag across all content, with file and line. An open Voice flag counts as unfinished work (`scripts/content/schema.ts`), so a flagged passage fails the build and cannot ship silently.
- Once Nicolas rewrites a flagged passage, remove both comments; don't leave resolved flags in place the way an answered Editorial note's prompt gets replaced rather than deleted.

### Nicolas controls

- site identity, tone, and creative direction;
- information-architecture changes and what deserves emphasis;
- all biography, professional history, CV facts, and contact information;
- project descriptions, research claims, and publication status;
- writing and final editorial decisions;
- photograph selection, sequencing, crops, captions, and public metadata;
- final approval of visual direction and production publishing.

### Implementation agents handle

- SvelteKit scaffolding and maintainable project structure;
- reusable components and responsive layouts;
- Markdown/content processing and schema validation;
- routing, tags, project/article relations, and canonical links;
- gallery and image optimization;
- accessibility implementation and testing;
- metadata, `sitemap.xml`, and approved feeds;
- static adapter and Cloudflare Workers static-assets configuration;
- automated checks, documentation, and technical maintenance.

### Agents must ask before

- changing the four primary navigation sections or canonical content relationships;
- changing the approved name treatment, palette foundation, type system, voice attributes, homepage posture, or strong visual motif; or resolving a documented prototype gate as a lasting choice without Nicolas's review;
- rewriting Nicolas's personal voice or publishing draft content;
- adding a backend, CMS, database, authentication, comments, search service, analytics, tracking, or another hosting provider;
- publishing contact data, precise photo locations, unpublished research, or unsupported performance claims;
- copying a template or an inspiration site's distinctive design.
- linking the live GitHub repository to Cloudflare, making a production deployment, attaching the custom domain, or changing DNS or hostname redirects.

Agents may make small, reversible implementation decisions consistent with this brief. Document decisions that affect content authoring, URLs, deployment, accessibility, or future maintenance.

## Recommended implementation sequence

1. Confirm the repository state, package manager, current SvelteKit guidance, and Cloudflare Workers/`wrangler.jsonc` settings.
2. Establish static prerendering, shared layout, the four-item navigation, footer, and foundational design tokens.
3. Add validated content collections and computed completeness reporting.
4. Implement Home, About Me, Writing and its collections, Photography, and CV routes. Leave a route unauthored rather than inventing its content; a public coming-soon state requires Nicolas's approval.
5. Implement UBQ-to-writing and Writing-to-photo-essay cross-links without duplication.
6. Add responsive media handling, accessibility details, metadata, sitemap, robots rules, and the CV download.
7. Add automated checks and a production build; inspect representative pages visually and with keyboard/accessibility tools.
8. Configure Cloudflare Workers previews and production deployment, then document the workflow.

Do not block an early release because Project Archive / Other Projects is omitted, or because article subtypes, RSS, site search, or analytics are unfinished.

## Minimum release acceptance criteria

- Home and every primary section included in the release have intentional responsive layouts. Any public coming-soon state is explicitly owner-approved.
- Every public route is included in the static build and works on direct navigation and refresh.
- The UBQ hub has real, supplied links or honest placeholders that are not published as working links.
- Related UBQ writing is produced from one source of metadata.
- Photo essays have one canonical URL under Writing and are discoverable from both Photography and Writing.
- CV HTML is readable and the approved PDF downloads successfully.
- Every page included in the release is complete; the build refuses an unfinished page rather than serving a partial one.
- Internal links, image paths, and metadata validate during the build.
- A top-level `build/404.html` works when a visitor requests an unknown route.
- Keyboard navigation, focus, landmarks, headings, contrast, alternative text, and reduced-motion behavior have been checked.
- Representative pages have no obvious layout shift, oversized image transfer, or unnecessary hydration.
- Page titles, descriptions, canonical URLs, social metadata, `sitemap.xml`, and `robots.txt` are correct for `nebve.com`.
- The documented local build matches Cloudflare Workers' production static-assets output.
- Nicolas has reviewed the visible design, copy, photographs, project claims, CV, and production preview.

## Open questions to preserve

Do not silently answer these on Nicolas's behalf:

- What exact near-white, blue, lime, secondary-text, rule, selection, and focus values should complete the approved black foundation?
- What final type sizes, measures, leading, weights, and heading/navigation capitalization should be used at narrow and wide viewports?
- What final link motion, annotation geometry, gallery spacing, and photo-essay responsive behavior should graduate from prototype to lasting rules?
- Which external profiles and contact methods should be public?
- What are the authoritative UBQ paper, code, and docs.rs URLs, and what claims may be made about the project?
- Which projects, if any, are ready to join UBQ at launch?
- Should the growing-projects section be labeled Project Archive, Other Projects, or something else, and should it appear at launch?
- Which photographs and photo essays are launch content, and what metadata may be published?
- What is the authoritative CV content and PDF filename?
- Should the site ship an RSS/Atom feed, privacy-respecting analytics, or neither?
- Should future Writing types distinguish articles, notes, and tutorials?

## Research basis

The accompanying `annotated_bibliography.md` records the sources informing this brief. Its main principles are: design around visitor goals, keep navigation shallow and comprehensible, use semantic and accessible structure, group focused writing into project collections, allow content to grow through tags and links, and keep the implementation static and maintainable.

Recheck version-sensitive implementation details against the official [SvelteKit static-site documentation](https://svelte.dev/docs/kit/adapter-static), [Cloudflare Workers static assets documentation](https://developers.cloudflare.com/workers/static-assets/), and [Cloudflare Workers custom-domains guide](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) before configuring production.
