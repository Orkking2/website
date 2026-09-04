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

Build a long-lived personal website that combines Nicolas's professional and research portfolio, technical writing, photography, and CV in a clear static site generated with SvelteKit, versioned in GitHub, and deployed to `nebve.com` through Cloudflare Pages.

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
- Hosting: Cloudflare Pages.
- Repository and content source of truth: GitHub.
- Primary navigation: About Me, Research & Projects, Writing, Photography, and CV.
- Home is reached through Nicolas's name or site mark; it does not need a sixth primary-navigation item.
- Photography contains a gallery and photo essays.
- The CV exists as readable HTML plus a downloadable PDF.
- UBQ is the initial featured research project and links to its overview, paper/preprint, code or repository, docs.rs documentation, and related writing.
- Articles related to UBQ live canonically in Writing and are surfaced automatically or explicitly from the UBQ page.
- Photo essays live canonically in Photography and are linked from Writing; do not create duplicate copies.
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

| Visitor                        | Likely question                                                      | Intended path                                                               |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Employer or collaborator       | Who is Nicolas, what can he do, and where is the evidence?           | Home → About Me or Research & Projects → CV or Contact                      |
| Researcher or technical reader | What is UBQ, what did Nicolas contribute, and where are the details? | Home → Research & Projects → UBQ → Paper, Code, docs.rs, or Related Writing |
| Reader                         | What is Nicolas researching or learning?                             | Home or Writing → Article → Related Project or Related Articles             |
| General or creative visitor    | What does Nicolas make and care about beyond technical work?         | Home → Photography → Gallery or Photo Essay                                 |

Keep important destinations within roughly three clicks of Home. Use familiar link labels that describe the destination; avoid clever labels that make visitors guess.

## Information architecture

```text
Home
│
├── About Me
│   ├── Biography / Background
│   ├── Experience
│   └── Contact + External Links
│
├── Research & Projects
│   ├── UBQ
│   │   ├── Project Overview
│   │   ├── Paper / Preprint
│   │   ├── Code / Repository
│   │   ├── docs.rs Documentation
│   │   └── Related Writing
│   │
│   └── Project Archive / Other Projects [provisional label; may be absent at launch]
│       └── Individual Project Pages
│
├── Writing
│   ├── Research / Tech Blog
│   │   └── Individual Article Pages
│   └── Photo Essays [links to canonical Photography pages]
│
├── Photography
│   ├── Gallery
│   └── Photo Essays
│       └── Individual Photo Essay Pages
│
└── CV
    ├── Web-Readable CV / Résumé
    └── Downloadable PDF

Site-wide
├── Nicolas's name or mark → Home
├── Contact link(s)
├── GitHub and approved external profiles
└── Footer navigation and copyright
```

### Required cross-links

The sitemap is a graph, not only a directory tree.

```text
UBQ project page ←→ Writing posts tagged or related to UBQ

Photography → Photo Essays ← Writing
                 │
                 └── one canonical URL per essay

About experience preview → full CV
Project summaries → project detail → external paper/code/docs
```

- A project page is stable, explanatory, and link-rich.
- A writing post is dated, narrower, and can evolve as the research develops.
- Tags aid discovery but should not force a visible submenu before enough content exists.
- Cross-links must be generated from validated metadata or an explicit relation, not fragile hard-coded duplication in several components.

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

### Research & Projects

Project summaries should answer: What is it? Why does it matter? What was Nicolas's role or contribution? Where can a visitor go deeper?

The initial UBQ hub should support:

- a plain-language project overview before low-level detail;
- a paper or preprint link;
- a source-code or repository link;
- a docs.rs link;
- related writing, ordered deliberately or by publication date;
- optional figures, benchmarks, or technical details only when supplied and contextualized.

Do not infer what “UBQ” expands to, claim performance results, or describe Nicolas's contribution beyond supplied source material.

### Writing

Launch around a Research / Tech Blog with individual article pages. Current candidate topics are:

- “How UBQ Reserves Producer Slots Without Locks”;
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
  coordinates; the ordinary per-photo caption disclosure (the small `i` control on a gallery tile)
  is deliberately simpler — hover or keyboard focus, not a click-to-toggle control.
- A selected photograph must retain a reviewed capture date and time. Order the main gallery by
  capture date and time, newest first; photo-essay sequencing remains editorial. The exact
  timestamp is not displayed in the gallery UI — it stays in the photo record.
- Nicolas chooses the photographs and approves their captions, crops, metadata, and presentation.

### CV

Provide a fast, readable HTML version and an obvious PDF download. Reuse structured experience data where sensible so About and CV facts do not drift, while treating the PDF as a separately reviewed artifact. The PDF must not be the only accessible version.

## Recommended route model

```text
/
/about
/projects
/projects/ubq
/projects/[slug]
/writing
/writing/[slug]
/photography
/photography/essays
/photography/essays/[slug]
/cv
```

Use clean, stable, lowercase slugs. If a route changes after publication, preserve inbound links with a redirect where Cloudflare Pages supports it. External paper, code, docs.rs, and PDF links must remain real links rather than being disguised as interface buttons without link semantics.

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
           Cloudflare Pages build + preview
                         │
                         ▼
             SvelteKit prerendered static files
                         │
                         ▼
                     nebve.com
```

- Use `@sveltejs/adapter-static` and prerender the site to a static output directory, normally `build`.
- Export `prerender = true` from the root layout and keep server-side rendering enabled during the build; do not turn the site into a client-only SPA.
- Ensure every published dynamic `[slug]` route is discoverable during prerendering through generated `entries`, reachable listing links, or another verified mechanism. Non-draft content must not disappear from `build`.
- Provide a real top-level `build/404.html`, not an SPA fallback, and verify it with an unknown URL.
- A visitor request must not require a database query or an application server.
- The GitHub repository is the content store and source of truth, not a runtime database.
- Do not add a CMS, database, authentication system, backend API, Cloudflare Function/Worker, or runtime content fetch without a concrete requirement and Nicolas's approval.
- Prefer build-time content loading and static HTML. Hydrate only components that genuinely need client-side behavior.
- Follow the existing lockfile and repository conventions once the project exists. Keep dependencies few, maintained, and justified.

### Suggested repository shape

Adapt this structure to current SvelteKit conventions rather than reproducing it mechanically:

```text
src/
├── content/
│   ├── writing/
│   ├── projects/
│   ├── photo-essays/
│   └── pages/
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

### Writing entry

```yaml
title: 'Head Packing in UBQ'
slug: 'head-packing-in-ubq'
summary: 'A concise, supplied description.'
published: YYYY-MM-DD
updated: YYYY-MM-DD # optional
tags: [supplied-tag]
relatedProjects: [ubq]
featured: false
draft: true
cover: null # optional
```

### Project entry

```yaml
title: 'UBQ'
slug: 'ubq'
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

Project body content may include the problem, context, Nicolas's contribution, approach, results, and next steps, but only when those facts are supplied. Derive related writing from `relatedProjects`, a validated tag convention, or a deliberate explicit list.

### Photo essay and gallery item

```yaml
title: 'Supplied Photo Essay Title'
slug: 'supplied-photo-essay-slug'
summary: 'A concise introduction.'
published: YYYY-MM-DD
location: null # optional and owner-approved
cover: '/images/photography/supplied-image.jpg'
featured: false
draft: true
inProgress: false # optional; true shows an "In progress" marker wherever the essay is listed
```

Each image record should be able to store `src`, an optional `title` (overlaid on the gallery tile),
`alt`, `caption` (revealed behind the `i` disclosure), `width`, `height`, a required reviewed capture
date and time, an optional timezone offset, an optional owner-approved location label, and optional
exact coordinates approved per image. Camera metadata is optional and should not be assumed. Gallery
order is derived from capture date and time rather than a manual index; the exact capture timestamp
stays in the record and is not displayed in the gallery UI.

### Shared data

Keep approved identity, external-profile, contact, navigation, and CV data in deliberate shared sources. Validate unique slugs, dates, internal references, image paths, and required alternative text. Exclude drafts from production while allowing them in local or preview builds when practical.

## Design and writing principles

- Follow `docs/voice-and-identity.md` for all public prose, typography, color, imagery, motion, annotation, footnote, photography, and authoring-system decisions.
- Aim for minimalist, communicative, professional, and personal—not generic, sterile, or trend-chasing.
- Let research, writing, photography, and CV feel related through one design system while allowing the gallery to use a more visual layout.
- Use progressive disclosure: summary → detail page → paper, repository, documentation, or deeper article.
- Start with visitor needs and place content where it is canonical; link to it elsewhere instead of duplicating it.
- Write purposefully, concisely, conversationally, and clearly. Preserve Nicolas's voice rather than replacing it with generic portfolio copy.
- Write incomplete-section copy in first person, as Nicolas describing his own unfinished site, not as an agent's checklist addressed to Nicolas. Use a plain "Coming soon" label and bulleted list of what will land there, matching the UBQ reading-path pattern, instead of "not supplied," "still needed," or similar process language.
- Use readable measures and deliberate density. Every non-code word uses the approved Times New Roman system stack. Keep the primary navigation to the five approved sections.
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
- Do not expose secrets, private drafts, unapproved CV data, unpublished papers, high-resolution originals, or sensitive image metadata.
- Treat all prose, project claims, dates, benchmarks, captions, and alt text as editorial content requiring factual support.
- Make external links safe and clearly recognizable. If a link opens a new tab, avoid doing so unnecessarily and include appropriate `rel` attributes.
- Keep dependencies current and audit significant additions. Static generation is a security and maintenance advantage; preserve it unless requirements change.

## GitHub and Cloudflare Pages workflow

1. Author or edit Markdown, structured data, images, and Svelte code locally.
2. Run formatting, type/content checks, tests, and a production build.
3. Commit to Git and push to GitHub.
4. Use a pull request and Cloudflare Pages preview for meaningful visual or content changes when the repository workflow supports it.
5. Review the preview at mobile and desktop sizes.
6. Merge the approved change to the production branch, expected to be `main` unless the repository says otherwise.
7. Let Cloudflare Pages rebuild and deploy the static `build` output to `nebve.com`.

The expected Pages settings are the repository's production branch (normally `main`), build command `npm run build`, and output directory `build`. Cloudflare's generic SvelteKit preset may suggest `.svelte-kit/cloudflare`, which is the Cloudflare-adapter output. This project deliberately uses `@sveltejs/adapter-static`; configure Pages to publish `build` instead. Attach `nebve.com` through the Pages custom-domain workflow. Choose one canonical production hostname, normally `https://nebve.com`, and redirect or otherwise deliberately configure alternate `www` and production `pages.dev` hostnames.

Document the exact Node version, package manager, build command, output directory, environment variables, Cloudflare project configuration, and custom-domain steps in the repository README once they exist. No secret should be required merely to build public content. Do not change production DNS or deploy publicly without Nicolas's authorization.

## Agent responsibilities and limits

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
- static adapter and Cloudflare Pages configuration;
- automated checks, documentation, and technical maintenance.

### Agents must ask before

- changing the five primary navigation sections or canonical content relationships;
- changing the approved name treatment, palette foundation, type system, voice attributes, homepage posture, or strong visual motif; or resolving a documented prototype gate as a lasting choice without Nicolas's review;
- rewriting Nicolas's personal voice or publishing draft content;
- adding a backend, CMS, database, authentication, comments, search service, analytics, tracking, or another hosting provider;
- publishing contact data, precise photo locations, unpublished research, or unsupported performance claims;
- copying a template or an inspiration site's distinctive design.
- linking the live GitHub repository to Cloudflare, making a production deployment, attaching the custom domain, or changing DNS or hostname redirects.

Agents may make small, reversible implementation decisions consistent with this brief. Document decisions that affect content authoring, URLs, deployment, accessibility, or future maintenance.

## Recommended implementation sequence

1. Confirm the repository state, package manager, current SvelteKit guidance, and Cloudflare Pages settings.
2. Establish static prerendering, shared layout, the five-item navigation, footer, and foundational design tokens.
3. Add validated content collections and draft filtering.
4. Implement Home, About Me, Research & Projects, UBQ, Writing, Photography, and CV routes. Keep missing content in drafts or leave its route unpublished; a public coming-soon state requires Nicolas's approval.
5. Implement UBQ-to-writing and Writing-to-photo-essay cross-links without duplication.
6. Add responsive media handling, accessibility details, metadata, sitemap, robots rules, and the CV download.
7. Add automated checks and a production build; inspect representative pages visually and with keyboard/accessibility tools.
8. Configure Cloudflare Pages previews and production deployment, then document the workflow.

Do not block an early release because Project Archive / Other Projects is omitted, or because article subtypes, RSS, site search, or analytics are unfinished.

## Minimum release acceptance criteria

- Home and every primary section included in the release have intentional responsive layouts. Any public coming-soon state is explicitly owner-approved.
- Every public route is included in the static build and works on direct navigation and refresh.
- The UBQ hub has real, supplied links or honest placeholders that are not published as working links.
- Related UBQ writing is produced from one source of metadata.
- Photo essays have one canonical URL and are discoverable from both Photography and Writing.
- CV HTML is readable and the approved PDF downloads successfully.
- Draft content is excluded from production.
- Internal links, image paths, and metadata validate during the build.
- A top-level `build/404.html` works when a visitor requests an unknown route.
- Keyboard navigation, focus, landmarks, headings, contrast, alternative text, and reduced-motion behavior have been checked.
- Representative pages have no obvious layout shift, oversized image transfer, or unnecessary hydration.
- Page titles, descriptions, canonical URLs, social metadata, `sitemap.xml`, and `robots.txt` are correct for `nebve.com`.
- The documented local build matches Cloudflare Pages' production output.
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

The accompanying `annotated_bibliography.md` records the sources informing this brief. Its main principles are: design around visitor goals, keep navigation shallow and comprehensible, use semantic and accessible structure, separate stable project hubs from dated writing, allow content to grow through tags and links, and keep the implementation static and maintainable.

Recheck version-sensitive implementation details against the official [SvelteKit static-site documentation](https://svelte.dev/docs/kit/adapter-static), [Cloudflare Pages SvelteKit guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/), and [Cloudflare Pages custom-domain guide](https://developers.cloudflare.com/pages/configuration/custom-domains/) before configuring production.
