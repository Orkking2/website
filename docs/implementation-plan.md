# nebve.com implementation plan

- **Status:** active
- **Owner:** Nicolas
- **Started:** 2026-09-04
- **Last updated:** 2026-09-04
- **Working branch:** `feat/identity-prototype`

This is the running plan for bringing `nebve.com` from the current local prototype to an approved, content-complete static site on Cloudflare Pages. The product baseline remains [vision.md](vision.md), and [voice-and-identity.md](voice-and-identity.md) remains authoritative for public voice and visual direction.

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
- The clean prototype baseline is preserved on `main` at commit `0309d68`.
- The identity implementation is isolated on `feat/identity-prototype`.
- The homepage identity direction has been approved for continued development.
- Article, annotation, gallery, viewer, and photo-essay specimens are implemented and awaiting visual review.
- The site remains non-indexable, has no Git remote, and has not been deployed.

## Delivery milestones

| Milestone                             | Status      | Exit condition                                                                  |
| ------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| M0 — Stable baseline                  | Complete    | Clean, reproducible prototype build preserved in Git.                           |
| M1 — Identity prototype               | In progress | Homepage, article, gallery, and photo-essay treatments reviewed and approved.   |
| M2 — Content system and shared design | Not started | Approved identity and Markdown authoring system work across the site.           |
| M3 — Content-complete private preview | Not started | All launch content and media are present with no public placeholders.           |
| M4 — Production launch                | Not started | Quality gates pass and `nebve.com` is verified after owner-approved deployment. |

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

| Required input                                                             | Status |
| -------------------------------------------------------------------------- | ------ |
| Homepage introduction and featured ordering                                | Needed |
| Biography and experience preview                                           | Needed |
| Approved contact methods and profile URLs                                  | Needed |
| UBQ overview, contribution, claims, figures, and authoritative links       | Needed |
| At least one finished article with real publication data                   | Needed |
| Selected photographs, sequence, captions, alt text, and permitted metadata | Needed |
| Structured CV facts and reviewed PDF                                       | Needed |

- [ ] Migrate supplied content without inventing missing facts.
- [ ] Generate responsive media variants with intrinsic dimensions.
- [ ] Remove sensitive EXIF location data unless explicitly approved.
- [ ] Keep captions, alt text, and longer context as separate fields.
- [ ] Remove every editorial placeholder and draft-only surface from launch output.

## Phase 6 — Release hardening

- [ ] Extend build verification for Markdown content, internal relations, images, metadata, and enhanced routes.
- [ ] Test keyboard order, visible focus, landmarks, headings, touch targets, contrast, and alternative text.
- [ ] Test annotation, footnote, gallery, and essay fallbacks without JavaScript.
- [ ] Test reduced motion, forced colors where practical, zoom, and responsive reflow.
- [ ] Verify representative Home, article, project, gallery, photo-essay, CV, and unknown routes.
- [ ] Check responsive image delivery, layout stability, client JavaScript, and page weight.
- [ ] Add accurate canonical, Open Graph, social-card, and supported structured metadata.
- [ ] Generate and review one site-wide social-preview image after the identity and copy are stable.
- [ ] Verify `sitemap.xml`, `robots.txt`, security headers, external links, and the CV download.
- [ ] Run `npm run quality` from a clean checkout.

## Phase 7 — Preview and launch

These actions require Nicolas's explicit approval when the phase begins.

- [ ] Connect the approved GitHub repository and push the reviewed branch.
- [ ] Configure Cloudflare Pages with production branch `main`, build command `npm run build`, output directory `build`, and Node `22.22.2`.
- [ ] Review a Cloudflare preview deployment on mobile and desktop.
- [ ] Complete final editorial, image, project-claim, CV, accessibility, and visual approval.
- [ ] Enable indexing only after all release guards pass.
- [ ] Merge the approved release to `main`.
- [ ] Attach `nebve.com` through the Cloudflare Pages custom-domain workflow.
- [ ] Deliberately configure the `www` and production `pages.dev` hostnames.
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

| ID    | Date       | Decision                                                                                                                                                                     | Status                       |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| D-001 | 2026-09-04 | Keep SvelteKit, static prerendering, GitHub as source of truth, and Cloudflare Pages with `build` output.                                                                    | Approved baseline            |
| D-002 | 2026-09-04 | Use lowercase `nebve.com` in Times New Roman as the site identity and a lowercase `n` favicon.                                                                               | Approved baseline            |
| D-003 | 2026-09-04 | Carry the black Times New Roman homepage-index direction into the article and photography prototypes. Interaction and responsive details remain subject to their own review. | Approved prototype direction |

## Change log

- **2026-09-04:** Created the running implementation plan after Phase 0 and the first homepage identity review.
- **2026-09-04:** Added the first article, annotation, gallery, viewer, and photo-essay specimens for Phase 1 review.
