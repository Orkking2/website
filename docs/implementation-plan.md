# nebve.com implementation plan

- **Status:** active
- **Owner:** Nicolas
- **Started:** 2026-09-04
- **Last updated:** 2026-09-05
- **Working branch:** `feat/identity-prototype`

This is the running plan for bringing `nebve.com` from the current local prototype to an approved, content-complete static site on Cloudflare Workers (static assets — see D-015; the platform was originally planned as Cloudflare Pages). The product baseline remains [vision.md](vision.md), and [voice-and-identity.md](voice-and-identity.md) remains authoritative for public voice and visual direction.

## How to maintain this document

- Update phase and task checkboxes as work is verified.
- Record owner approvals and lasting implementation decisions in the decision log.
- Keep trial values labeled as provisional until Nicolas approves them.
- Add newly discovered work to the appropriate phase instead of allowing it to remain implicit.
- Do not mark the launch phase complete until the live domain and rollback path are verified.

## Current snapshot

- The SvelteKit application prerenders nine routes with `@sveltejs/adapter-static`.
- The production build includes a top-level `404.html` and release-state verification.
- `npm run quality` passes.
- `main` and `feat/identity-prototype` both point at the current identity-prototype work; `main` was fast-forwarded rather than left on the old baseline once this work was ready to push.
- The identity implementation, previously isolated on `feat/identity-prototype`, is now also on `main`.
- The homepage identity direction has been approved for continued development.
- Article, annotation, gallery, viewer, and photo-essay specimens are implemented and awaiting visual review.
- A representative 27-image iPhone HEIC batch is available locally for designing and testing a private photography-intake workflow. Nicolas has reviewed and promoted 6 draft records from that batch; 4 are marked for gallery inclusion and are wired into the live catalog for peer review, and 2 remain promoted but excluded from the gallery.
- One real writing entry ("How UBQ Reserves Producer Slots Without Locks") is published, sourced from Nicolas's UBQ repository and an evolving internal paper draft. The UBQ project record now links its public repository.
- The site remains non-indexable (`noindex, nofollow`, `robots.txt` disallow). It was previously deployed to a private, unlisted Cloudflare Pages preview for peer design-direction review — see D-008; that preview predates the D-015 move to Workers and is not the current deployment target.
- The repository is now connected to GitHub at [`Orkking2/website`](https://github.com/Orkking2/website) (public), with `main` and `feat/identity-prototype` both pushed. Cloudflare is not yet connected to it — see D-012, D-015, and "Deploying to Cloudflare Workers" in the README. This is still not the full Phase 7 production launch: no Cloudflare Git connection, no custom domain, and indexing remains disabled.

## Delivery milestones

| Milestone                             | Status      | Exit condition                                                                                    |
| ------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| M0 — Stable baseline                  | Complete    | Clean, reproducible prototype build preserved in Git.                                             |
| M1 — Identity prototype               | In progress | Homepage, article, gallery, and photo-essay treatments reviewed and approved.                     |
| M2 — Content system and shared design | Not started | Approved identity, Markdown authoring, and local photography-intake systems work across the site. |
| M3 — Content-complete private preview | Not started | All launch content and media are present with no public placeholders.                             |
| M4 — Production launch                | Not started | Quality gates pass and `nebve.com` is verified after owner-approved deployment.                   |

## Phase 0 — Stabilize the prototype

- [x] Fix the existing formatting failure.
- [x] Run type checking, linting, formatting checks, the production build, and build verification.
- [x] Scan the baseline for accidentally included credentials or oversized source files.
- [x] Preserve the prototype in Git.
- [x] Create an isolated identity-prototype branch.

Completion evidence: `npm run quality` passes, and commits `bf0caf7` and `0309d68` preserve the verified baseline.

## Phase 1 — Prototype the identity

### Homepage and shared masthead

- [x] Replace the provisional personal name treatment with lowercase `nebve.com`.
- [x] Replace the rounded green `N` favicon with a plain lowercase `n` treatment.
- [x] Establish centralized candidate tokens for black, near-white, blue, lime, secondary text, rules, selection, and focus.
- [x] Apply Times New Roman to all non-code text in the prototype slice.
- [x] Recompose Home as a compact index rather than a large promotional hero.
- [x] Prototype the reserved-border link lift without layout movement.
- [x] Receive approval to carry the homepage direction into the remaining prototypes.

### Article and annotations

- [x] Build a representative technical-article fixture using clearly marked non-public content.
- [x] Prototype the wide reading column and one open-by-default annotation rail.
- [x] Add a single rail collapse control with a complete no-JavaScript reading path.
- [x] Convert annotations to inline disclosures at narrow widths.
- [x] Prototype footnote references, canonical notes, return links, and optional previews.
- [ ] Verify focus, hover, Escape dismissal, reduced motion, and content-on-hover behavior.

### Photography and photo essays

- [x] Build a mixed-aspect gallery fixture without publishing substitute photography.
- [x] Prototype linked-image borders, keyboard focus, and the `.txt` essay marker.
- [x] Prototype the full-viewport viewer with an ordinary-link fallback.
- [x] Prototype the pinned-image and advancing-text essay treatment.
- [x] Define narrow, short-viewport, touch, keyboard, and reduced-motion fallbacks.

### Phase review gate

- [ ] Review article measure, annotation width, alignment tolerance, and collapse treatment.
- [ ] Review gallery spacing, viewer controls, and `.txt` marker geometry.
- [ ] Review the photo-essay transition across representative viewports.
- [ ] Promote approved prototype values into lasting shared tokens and rules.

## Phase 2 — Establish the authoring system

### Shared content authoring

- [ ] Run a small MDsveX compatibility spike against the current SvelteKit and Svelte versions.
- [ ] Add only the Markdown, validation, and image-build dependencies that the implementation requires.
- [ ] Create content directories for pages, projects, writing, and photo essays.
- [ ] Define typed, file-specific frontmatter schemas and actionable validation errors.
- [ ] Build one content index that validates unique slugs, dates, references, URLs, images, and alternative text.
- [ ] Derive UBQ-related writing from `relatedProjects` metadata.
- [ ] Keep photo essays canonical under Photography while surfacing them from Writing.
- [ ] Exclude drafts from production and make them available in local previews when practical.
- [ ] Add content scaffolding and fast validation commands.
- [ ] Preserve first-published dates and prompt rather than overwrite substantive revision dates.

### Photography intake and review

Build a private, batch-oriented local authoring tool, not a public admin route, CMS, or production API. It must accept an ordinary folder exported from a phone, keep unpublished originals and metadata out of Git and `static`, and promote only reviewed photographs into the site's content system.

Target workflow:

1. Nicolas transfers a batch from the phone into a backed-up computer photo archive or export folder.
2. `npm run photos:import -- <folder> --batch <name>` copies the inputs into a clearly labeled, Git-ignored local inbox such as `.local/photography/<batch>/originals`. Import never edits, moves, or deletes the supplied files; the inbox is a working copy, not a backup.
3. Import scans recursively, computes a content hash, detects exact duplicates and repeat imports, reads available capture metadata, creates orientation-correct private thumbnails, and records warnings without exposing a photograph publicly.
4. `npm run photos:review -- --batch <name>` opens a loopback-only review workspace with a contact sheet and a large single-image view. It supports capture-time sorting, previous/next keyboard navigation, select/hold/reject states, continuous local saving, and a visible count of incomplete records.
5. For each photograph, Nicolas can review or assign a stable ID, optional title, caption, optional draft alt text, required captured date and time, optional public location label, explicit per-image coordinate publication, gallery inclusion, and an optional photo-essay relationship. Gallery order is derived from capture time, newest first. Linking an essay can choose an existing essay or scaffold a new draft; the canonical essay prose remains Markdown rather than being duplicated in the photo record.
6. `npm run photos:promote -- --batch <name>` promotes selected records as drafts. It creates a bounded publication master outside `static`, normalizes orientation and color without destructive cropping, removes private metadata, and writes one validated public photo record. It never makes a photograph production-visible by itself.
7. The local draft preview shows selected photographs and incomplete metadata. Publication requires an explicit status change, successful validation and build, review of the generated variants, and the normal Git/preview approval workflow.

Keep private intake data separate from public content data:

| Private, Git-ignored intake record                                | Reviewed public photo record                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Source filename and content hash                                  | Stable ID and managed asset                                   |
| Exact extracted capture timestamp and confidence/timezone warning | Required owner-reviewed capture date/time and optional offset |
| Private GPS suggestion and metadata-presence warnings             | Optional location label and per-image approved coordinates    |
| Import and review status                                          | Draft/published state; gallery inclusion sorted newest first  |
| Local thumbnail/cache paths                                       | Optional title, caption, alt text, and essay slug             |

Implementation requirements:

- [x] Add the local inbox, generated review thumbnails, and private manifests to `.gitignore`; add a guard that fails if an original HEIC or private staging path is accidentally tracked or copied into the public output.
- [x] Spike the smallest maintained metadata and image toolchain against the representative HEIC batch. The local intake step may be macOS-specific, but the committed publication masters and production build must remain reproducible in CI and Cloudflare Workers.
- [x] Support HEIC, JPEG, and PNG; detect unsupported RAW files and Live Photo video companions without silently discarding them.
- [x] Make import idempotent by content hash, preserve original filenames only as private provenance, and keep public asset paths stable when a title or caption changes.
- [ ] Preserve aspect ratio and the intended photographic appearance. Verify orientation and Display P3 conversion/profile handling in Safari and Chromium before choosing lasting output settings.
- [x] Treat extracted dates and times as suggestions, but require every selected photograph to retain a reviewed date and time. Preserve the original local value privately, surface missing or ambiguous timezone information, and let Nicolas correct it before any public value is written.
- [x] Keep extracted coordinates private by default and do not reverse-geocode them. Permit exact latitude and longitude in the public record only through an explicit per-image review choice; continue stripping GPS metadata from image files.
- [x] Derive gallery order from reviewed capture time, newest first. Keep photo-essay sequencing editorial rather than reordering it automatically.
- [x] Permit title, location, essay, and alt text to remain blank during intake. Because selected gallery photographs are normally meaningful rather than decorative, publication must require reviewed alt text unless Nicolas explicitly marks an image decorative after review.
- [x] Keep caption distinct from title, alt text, location, and essay prose. A blank caption must be a deliberate reviewed choice rather than an overlooked field.
- [ ] Generate responsive variants and intrinsic dimensions from the sanitized publication master at build time. Do not deploy HEIC inputs or full-resolution phone originals.
- [ ] Validate that promoted masters and every generated variant contain no GPS, device serial, private source path, or other unapproved EXIF metadata.
- [x] Document phone transfer, batch import, review, promotion, preview, correction, removal, and recovery steps with copy-pasteable commands.

Representative-batch finding on 2026-09-04: the 27 supplied files are 27 unique HEIC images totaling 49.4 MiB. They report 4032 × 3024 source pixel matrices, Display P3 color, orientation values 1 and 6, and readable capture timestamps spanning 2026-07-02 through 2026-09-02. Every file has an explicit timezone offset and contains GPS, device, and XMP metadata. Exact coordinates now remain available only in the private manifest as review suggestions and are excluded from public records unless approved per image. The HEIC pixel path produced 27 unique, oriented, sRGB review images with no sensitive metadata. Exact cross-browser appearance review remains open. The files remain outside the repository and are test inputs, not a publication selection.

## Phase 3 — Apply the shared identity

- [ ] Replace the remaining cream/green theme, background grid, cards, pills, and oversized hero treatments.
- [ ] Apply the approved tokens, typography, spacing, rule, focus, link, and motion systems globally.
- [ ] Rebuild the shared header, five-item navigation, footer, skip link, and active states.
- [ ] Keep static pages free of client JavaScript and enable enhancement only where interaction requires it.
- [ ] Verify the shared shell at narrow, medium, and wide viewports.

## Phase 4 — Implement the content surfaces

- [ ] Home: orient briefly and surface featured research, writing, photography, and About/Contact paths.
- [ ] About Me: publish approved biography, experience preview, contact methods, and external profiles.
- [ ] Research & Projects: publish UBQ and omit an empty project archive.
- [ ] UBQ: provide overview, contribution, mechanism, limitations, resources, and metadata-derived related writing.
- [ ] Writing: support publication and revision dates, code, figures, citations, footnotes, accessible tables, terms, and annotations.
- [ ] Photography: build the filterless mixed-aspect gallery and accessible viewer.
- [ ] Photo essays: implement one canonical URL and the approved pinned-image reading behavior.
- [ ] CV: render shared structured experience data as HTML and provide the reviewed PDF download.
- [ ] 404: retain a useful, static, top-level error page.

## Phase 5 — Integrate approved content and media

| Required input                                                             | Status                                                                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Homepage introduction and featured ordering                                | Needed                                                                                              |
| Biography and experience preview                                           | Needed                                                                                              |
| Approved contact methods and profile URLs                                  | Needed                                                                                              |
| UBQ overview, contribution, claims, figures, and authoritative links       | Repository link supplied; overview, contribution, and figures still needed                          |
| At least one finished article with real publication data                   | One published: "How UBQ Reserves Producer Slots Without Locks"                                      |
| Representative HEIC batch for intake-workflow testing                      | Available locally; 6 records promoted, 4 selected for the live gallery                              |
| Selected photographs, sequence, captions, alt text, and permitted metadata | 4 photographs live with reviewed titles/captions/alt text; responsive-variant pipeline still needed |
| At least one photo essay demonstrating the reading treatment               | One published, deliberately marked in progress: "Eyes that pierce the soul"                         |
| Structured CV facts and reviewed PDF                                       | Needed                                                                                              |

- [ ] Migrate supplied content without inventing missing facts.
- [ ] Run approved photographs through the intake, review, and draft-promotion workflow; do not treat presence in an imported batch as publication approval.
- [ ] Generate responsive media variants with intrinsic dimensions.
- [ ] Remove sensitive EXIF location data unless explicitly approved.
- [ ] Keep titles, captions, alt text, capture data, public location labels, and longer essay context as separate fields.
- [ ] Remove every editorial placeholder and draft-only surface from launch output.

## Phase 6 — Release hardening

- [ ] Extend build verification for Markdown content, internal relations, images, metadata, and enhanced routes.
- [ ] Test keyboard order, visible focus, landmarks, headings, touch targets, contrast, and alternative text.
- [ ] Test annotation, footnote, gallery, and essay fallbacks without JavaScript.
- [ ] Test reduced motion, forced colors where practical, zoom, and responsive reflow.
- [ ] Verify representative Home, article, project, gallery, photo-essay, CV, and unknown routes.
- [ ] Check responsive image delivery, layout stability, client JavaScript, and page weight.
- [ ] Re-import the representative photo batch to verify duplicate detection, unchanged source files, stable IDs, metadata warnings, and recovery from an interrupted review.
- [ ] Inspect sanitized masters and built variants independently to verify that no unapproved metadata or private paths survive.
- [ ] Add accurate canonical, Open Graph, social-card, and supported structured metadata.
- [ ] Generate and review one site-wide social-preview image after the identity and copy are stable.
- [ ] Verify `sitemap.xml`, `robots.txt`, security headers, external links, and the CV download.
- [ ] Run `npm run quality` from a clean checkout.

## Phase 7 — Preview and launch

These actions require Nicolas's explicit approval when the phase begins.

- [x] Connect the approved GitHub repository and push the reviewed branch. (D-012)
- [ ] Configure the Cloudflare Worker with production branch `main`, build command `npm run build`, deploy command `npx wrangler deploy`, and Node `24.20.0`.
- [ ] Review a Cloudflare preview deployment on mobile and desktop.
- [ ] Complete final editorial, image, project-claim, CV, accessibility, and visual approval.
- [ ] Enable indexing only after all release guards pass.
- [ ] Merge the approved release to `main`.
- [ ] Attach `nebve.com` through the Cloudflare Workers custom-domain workflow.
- [ ] Deliberately configure the `www` and production `workers.dev` hostnames.
- [ ] Verify TLS, direct navigation, refreshes, redirects, the top-level 404, sitemap, robots rules, and cache behavior.
- [ ] Record the deployed version and rollback procedure.

## Deferred unless separately approved

- Project Archive / Other Projects and its visible label.
- RSS or Atom.
- Analytics or tracking.
- Search.
- Comments, authentication, a CMS, database, API, Worker, or other runtime backend.
- A visitor-facing theme configurator.
- Formal article subtypes beyond what launch content requires.

## Decision log

| ID    | Date       | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Status                                                                                                       |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| D-001 | 2026-09-04 | Keep SvelteKit, static prerendering, GitHub as source of truth, and Cloudflare Pages with `build` output.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Approved baseline; hosting platform superseded by D-015 (Cloudflare Workers static assets)                   |
| D-002 | 2026-09-04 | Use lowercase `nebve.com` in Times New Roman as the site identity and a lowercase `n` favicon.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Approved baseline                                                                                            |
| D-003 | 2026-09-04 | Carry the black Times New Roman homepage-index direction into the article and photography prototypes. Interaction and responsive details remain subject to their own review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Approved prototype direction                                                                                 |
| D-004 | 2026-09-04 | Add an ergonomic phone-export photography workflow with batch import, per-image review, optional title/location/essay, caption, draft alt text, capture date/time, and explicit draft promotion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Approved workflow requirement                                                                                |
| D-005 | 2026-09-04 | Keep original phone files and raw metadata in a private Git-ignored intake area; allow only reviewed records and sanitized, bounded publication masters into the versioned site source.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Verified for intake; publication variants remain open                                                        |
| D-006 | 2026-09-04 | Use Apple ImageIO only for private metadata inspection, libheif WebAssembly for HEIC pixels, and sharp for sanitized review/draft outputs and future reproducible build variants.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Implemented intake toolchain; visual color review open                                                       |
| D-007 | 2026-09-04 | Require reviewed capture date and time for selected photographs, order the gallery newest first by capture time, and allow exact coordinates only through explicit per-image publication approval.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Approved content and privacy rule                                                                            |
| D-008 | 2026-09-04 | Under time pressure for peer feedback, deploy a private, unlisted Cloudflare Pages preview via direct upload (`wrangler pages deploy`) rather than waiting on the full Phase 7 sequence. Indexing stays disabled and no custom domain is attached; this is scoped as a design-and-content review aid, not the production launch. The Cloudflare account used for this preview (an Apple-relay-email account) has not been confirmed as the same account that manages `nebve.com`'s DNS — reconcile before Phase 7.                                                                                                                                                                                                                                                                                                                                                                                                | Approved as a time-boxed peer-review deployment; reconcile Cloudflare account before production launch       |
| D-009 | 2026-09-04 | Replace third-person "Nicolas still needs to supply..." / "not supplied" editorial-placeholder language site-wide with a first-person "Coming soon" convention: Nicolas speaking about his own unfinished site, plus a plain bulleted list of what will land in that section, modeled on the UBQ reading path.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Approved voice standard; recorded in `voice-and-identity.md`                                                 |
| D-010 | 2026-09-04 | Redesign the photography gallery as a tightly fitted grid with each photograph's title overlaid on the image and its caption revealed only through a hover-or-keyboard-focus `i` control, deliberately not a click-to-toggle disclosure. The exact capture timestamp remains in the photo record for sorting but is no longer displayed in the gallery UI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Approved gallery treatment; recorded in `voice-and-identity.md`                                              |
| D-011 | 2026-09-04 | Publish one deliberately unfinished photo essay ("Eyes that pierce the soul," linked to an already-selected gallery photograph) as a real, working example of the skeletal pattern, with an `inProgress` flag surfaced as an "In progress" marker wherever the essay is listed. No essay narrative was invented; the essay body says plainly that the account hasn't been written yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Approved as a demonstration entry, not a content commitment                                                  |
| D-012 | 2026-09-04 | Created the public `Orkking2/website` GitHub repository as the project's Git source of truth, fast-forwarded `main` to the identity-prototype work, and pushed both `main` and `feat/identity-prototype`. Connecting Cloudflare Pages to this repository and attaching the `nebve.com` custom domain remain Nicolas's to complete in the Cloudflare dashboard — that first connection needs an interactive login, and D-008's open question about which Cloudflare account manages `nebve.com`'s DNS is still unresolved. Exact steps are recorded in the README's "Deploying to Cloudflare Workers" section (renamed by D-015).                                                                                                                                                                                                                                                                                  | Approved and completed for the GitHub half; Cloudflare connection still pending Nicolas                      |
| D-013 | 2026-09-05 | While connecting Cloudflare Pages, discovered project creation defaulted to a Git-connected Worker (`wrangler deploy`) rather than classic Pages — Cloudflare's dashboard now steers new projects toward Workers. Redirected to Pages explicitly (Workers & Pages → Create application → Pages tab → Connect to Git). Separately, `.node-version` `22.22.2` was pinned to a Node.js patch release with a confirmed upstream-broken bundled npm (missing internal `promise-retry` module, reported independently against Heroku's buildpack, GitHub Actions runner images, and npm/cli — not a Cloudflare-specific bug); repinned to `22.16.0` as an interim fix.                                                                                                                                                                                                                                                  | Worker-vs-Pages redirect reversed by D-015; the `22.16.0` Node repin turned out to be incomplete — see D-014 |
| D-014 | 2026-09-05 | The `22.16.0` repin from D-013 traded one failure for another: `package.json`'s `packageManager: "npm@12.0.2"` pin requires Node `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` (per npm's own `engines` field), which `22.16.0` doesn't satisfy, so Cloudflare's build failed with `EBADENGINE` trying to install npm 12.0.2. Node's own `22.22.3` changelog confirms `deps: upgrade npm to 10.9.8`, i.e. that release fixed the exact broken-bundled-npm regression from D-013. Repinned `.node-version` to `22.23.2` (latest available 22.x patch), which satisfies both npm@12.0.2's engine floor and stays clear of the broken `22.22.2` release.                                                                                                                                                                                                                                                                    | Applied; Cloudflare Pages connection still pending a successful build                                        |
| D-015 | 2026-09-05 | Reconsidered D-013's redirect back to classic Pages after Nicolas questioned it directly. Cloudflare Workers now serve static assets natively with no Worker script required, making a static-assets Worker architecturally identical to what Pages provided (same `build` output, no server code, no backend) — and Cloudflare's own documentation states Workers, not Pages, is its primary platform for new projects. Adopted Cloudflare Workers static assets as the deployment target: added a deliberate, minimal `wrangler.jsonc` (`assets.directory: "./build"`, `assets.not_found_handling: "404-page"`, no `main` field) replacing the stray auto-generated one from D-013's discovery, and updated AGENTS.md, README, and this plan throughout. The "no Cloudflare Function/Worker without approval" rule in AGENTS.md is clarified, not repealed: it still blocks a `main` script with dynamic logic. | Approved and implemented; supersedes D-001's Cloudflare Pages baseline for hosting platform                  |
| D-016 | 2026-09-05 | Reconsidered the Node 22 line entirely after Nicolas asked whether to modernize instead of chasing minimum-compatible patches. Node 22 is in LTS Maintenance mode nearing end of life; Node 24 (`24.20.0` at the time) is the current Active LTS line and is one of npm@12.0.2's own accepted engine ranges (`^24.15.0`). Repinned `.node-version` to `24.20.0`, widened `package.json` `engines.node` from `>=22 <23` to `>=24 <25`, bumped `@types/node` from `^22` to `^24`, and added `wrangler` as a pinned devDependency (`^4.129.0`) with a `deploy` script, since deployment now depends on it directly rather than an ad hoc `npx` call. Local Node is still `22.22.2` on Nicolas's machine as of this decision — `npm run`/`npm ci` will refuse to run locally (`engine-strict=true` in `.npmrc`) until Node 24.x is installed locally too.                                                             | Applied to the repo; local machine Node upgrade still pending                                                |

## Change log

- **2026-09-04:** Created the running implementation plan after Phase 0 and the first homepage identity review.
- **2026-09-04:** Added the first article, annotation, gallery, viewer, and photo-essay specimens for Phase 1 review.
- **2026-09-04:** Designed the private batch photography-intake workflow from a representative 27-image iPhone HEIC sample and added its implementation and verification tasks.
- **2026-09-04:** Implemented the photography toolchain spike, idempotent batch import, loopback review workspace, draft promotion boundary, privacy guard, tests, and operating guide against the private HEIC batch.
- **2026-09-04:** Made capture date/time mandatory for selected photographs, replaced manual gallery order with newest-first capture sorting, and added per-image opt-in coordinates with accessible information disclosure.
- **2026-09-04:** Wired 4 owner-reviewed photographs and a real UBQ writing entry into the live catalog, added the UBQ repository link, and deployed a private, non-indexed Cloudflare Pages preview (direct upload, not GitHub-connected) so peers can review identity direction against real content. Noted 2 pre-existing failures in `scripts/photos/core.test.mjs` (coordinate-suggestion migration tests) that predate this change and remain open.
- **2026-09-04:** Audited public-facing copy for language that read as an internal note to Nicolas rather than the site's own voice, and rewrote it first person with a "Coming soon" bulleted convention (D-009). Redesigned the photography gallery to a tightly fitted grid with overlaid titles and a hover/focus-only caption disclosure, dropped the displayed capture timestamp (D-010), and wired each photo's already-authored `title` field from its private record into the public catalog. Published one deliberately in-progress photo essay as a working example of the pattern (D-011).
- **2026-09-04:** Created the public `Orkking2/website` GitHub repository, fast-forwarded `main` to the identity-prototype work, and pushed both `main` and `feat/identity-prototype` (D-012). Cloudflare Pages is not yet connected; the README now documents the exact dashboard steps Nicolas needs to complete that connection and attach `nebve.com`.
- **2026-09-05:** Diagnosed two Cloudflare Pages connection failures with Nicolas: project creation had defaulted to a Worker instead of classic Pages, and `.node-version` was pinned to a Node.js patch with an upstream-broken bundled npm (D-013). The interim Node repin then collided with `packageManager`'s own engine requirement; repinned again to `22.23.2`, the latest 22.x patch, which satisfies both constraints (D-014).
- **2026-09-05:** Reversed course on both open questions after Nicolas asked to reconcile them: adopted Cloudflare Workers static assets as the deployment target instead of fighting the platform's Pages-vs-Worker default, with a deliberate `wrangler.jsonc` replacing the stray auto-generated one (D-015); modernized off the Node 22 Maintenance-LTS line entirely to Node 24 Active LTS (`24.20.0`), widening `engines.node`, bumping `@types/node`, and pinning `wrangler` as a real devDependency (D-016). Rewrote AGENTS.md, README, and this plan throughout to describe Workers rather than Pages.
