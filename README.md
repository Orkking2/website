# nebve.com

Nicolas's personal website for research and projects, technical writing, photography, and a web-readable CV. The repository is the content source of truth; SvelteKit prerenders it to static files served by Cloudflare Workers (configured for static assets only — see "Deploying to Cloudflare Workers" below for why this isn't classic Cloudflare Pages).

The active implementation sequence, approval gates, content dependencies, and decision log are maintained in [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Current status

This is a local, content-first prototype—not a launch-ready site.

- The approved information architecture and four-item primary navigation are implemented.
- Home, About Me, Writing (including UBQ, LUBQ, and photo-essay collections), Photography, CV, and a real 404 page are prerendered.
- Nicolas's formal proposal informs the visitor-facing purpose, audiences, quality criteria, and progressive UBQ reading path; the authority map is recorded in `docs/vision.md`.
- The site's voice, visual identity, interaction language, photography behavior, and target Markdown authoring workflow are approved and recorded in `docs/voice-and-identity.md`.
- Pages use explicit `noindex, nofollow` metadata, and `robots.txt` blocks crawling.
- The proposal supports UBQ's general subject and in-progress status. No expanded name, contribution, architecture, results, performance claims, resource links, personal history, contact details, articles, photographs, CV facts, or downloadable CV have been invented.
- The approved identity is implemented: absolute black, near-white text, a lime interaction state, Times New Roman throughout, and a lowercase `n` favicon. Exact secondary token values, typographic metrics, link motion, gallery spacing, and the photo-essay transition remain prototype gates awaiting Nicolas's review.
- The repository is connected to GitHub at [`Orkking2/website`](https://github.com/Orkking2/website), and `nebve.com` is live: it serves this project's build over HTTPS with the repository's own `static/_headers` cache policy applied, so the Worker, the custom domain, and the account that owns the DNS zone are all confirmed working (resolving D-008 and D-017). Production deploys from `main` — see "Deploying to Cloudflare Workers" below.

## Local development

Prerequisites:

- Node.js `24.20.0` (recorded in `.node-version`), the current Active LTS line
- npm `12.0.2` (recorded in `package.json`)

```sh
npm ci
npm run dev
```

Useful checks:

```sh
npm run check
npm run lint
npm run build
npm run quality
```

`npm run build` creates `build/` with static HTML and assets, then verifies all intended routes, essential page metadata, internal page links, release guards, and the top-level `build/404.html`.

## Photography

`.local/photography/` is the library: Git-ignored, holding the original phone files untouched and uncopied. Putting a photograph there is what selects it. One command reads the library and opens a private, loopback-only studio for editing what each photograph says:

```sh
npm run photos
```

Edits save straight into `src/content/photography/.photogrid/`, which is ordinary tracked source. A photograph is served once it is marked **reviewed** and has alternative text — a screen reader has that instead of the image. Until then it is unfinished and simply left out of the build, so the library can hold work in progress without holding up the site. Everything else is content you write or leave alone, and publication is `git push`.

The studio is also where photo essays are assembled: import photographs into an essay, name each one so the prose can refer to it, set the order and the cover. An essay's own frontmatter is the single record of what it holds.

Every served image carries `nebve.com 52°21'29.7"N 4°52'50.8"E 03 Jul 2026 19:52:06` burned into its pixels, drawn after each resize so it stays legible at every size and through lossy compression. Coordinates read in degrees, minutes and seconds, and the month is spelled out so a date cannot be read in the wrong order. Committed masters are clean, bounded, sRGB, and stripped of EXIF, GPS, and device data.

See [`docs/photography-intake.md`](docs/photography-intake.md) for the library layout, the `.data` cache, and what reaches the repository.

## Architecture

- Framework: SvelteKit with TypeScript
- Rendering: static prerendering with SSR kept on during the build and client-side rendering disabled for the current non-interactive prototype
- Adapter: `@sveltejs/adapter-static` with strict prerender validation
- Output: `build`, deployed as Cloudflare Workers static assets per `wrangler.jsonc` (`assets.directory`) — no Worker script, no dynamic backend
- Content: the page tree under `src/content/` — a Markdown file is a page, a directory is a page with children, and `index.md` serves the directory's own path — validated by `scripts/content/` and exposed through the generated model in `src/lib/content/catalog.ts`; no database, CMS, API, or runtime content fetch
- Editorial direction: `docs/vision.md` records the authority map; `docs/voice-and-identity.md` is the approved voice and identity standard
- Routes: derived from the content tree, not declared. `src/routes/[...path]` serves every page and exports them all for prerendering; the header, sitemap, and output verification read the same generated model
- Canonical origin: `https://nebve.com`

Adding a page means adding a Markdown file. Nothing else has to be edited: it prerenders to static output, and a new top-level page joins the header on its own.

The project follows the official [SvelteKit static-site guidance](https://svelte.dev/docs/kit/adapter-static). `@sveltejs/adapter-cloudflare` (a separate package, listed as an unused devDependency) would output to `.svelte-kit/cloudflare` for SSR-on-Workers deployments; this repository deliberately uses `@sveltejs/adapter-static` instead, so `wrangler.jsonc` points `assets.directory` at `build`.

## Content needed next

The most useful next step is an owner-approved content packet:

1. Rewrite the proposal-backed homepage language in the approved public voice as real content becomes available.
2. Supply a short biography, experience preview, and approved contact/profile links.
3. Supply the authoritative UBQ overview, Nicolas's contribution, API and architecture details, and paper, code, and docs.rs URLs.
4. At least one finished writing entry with summary and real publication date.
5. A selected group of photographs with order, aspect-ratio/crop decisions, alternative text, captions, and approved public metadata.
6. Structured CV facts and the reviewed PDF filename.
7. Owner review of the remaining prototype gates: exact colors, typography metrics, link motion, article rail, gallery spacing, and photo-essay transition.

Pages are Markdown files in the directory-based tree under `src/content/`; directories serve their `index.md`. Writing contains project collections and photo essays. Missing required content is reported in development and refuses a production build; there is no `draft` flag. See [the authoring guide](docs/authoring.md) for collection lists, dates, related links, and photo placement. Gallery titles are embedded into generated images, captions sit below them, and stable `/photography#photo-ID` links reopen the viewer. Responsive assets and the direct-image fallback are capped at 2400 pixels wide; clean masters remain source assets. See [gallery growth](docs/gallery-growth.md) for the proposed archive and search approach.

## Launch checklist

Before making the site public:

1. Remove every editorial placeholder and approve the public copy. The build rejects placeholder-marked surfaces when indexing is enabled.
2. Add responsive photographs and the reviewed CV PDF.
3. Settle the remaining prototype gates: exact secondary colors, typographic metrics, link motion, article rail, gallery spacing, and the photo-essay transition.
4. Add and review a social-preview image.
5. Confirm the `LICENSE` attribution (`Orkking2`) is intentional.
6. Change `site.indexable` in `src/lib/data/site.ts` only after the featured content is finished and approved. This automatically enables indexable metadata, `robots.txt`, and populated sitemap entries; the launch guard rejects an indexable build that still contains a `<Notice>` placeholder, or one without an approved dated writing entry and reviewed photographs.
7. Run `npm run quality` and inspect a Cloudflare Workers preview at mobile and desktop sizes.

## Deploying to Cloudflare Workers

This project deploys as a Cloudflare Worker configured for **static assets only** — `wrangler.jsonc` has no `main` script, so requests never reach a Worker script at all; Cloudflare serves the prerendered `build` directory directly. This is deliberate, not a workaround: Cloudflare's dashboard now defaults new "Workers & Pages" project creation to a Git-connected Worker rather than classic Pages, and Cloudflare's own documentation describes Workers as its primary platform going forward. A static-assets Worker is architecturally identical to what Pages provided here — same static output, no server code, no backend — so there's no reason to fight the platform's default.

The GitHub repository ([`Orkking2/website`](https://github.com/Orkking2/website)) is the source of truth, and the connection is made: `nebve.com` serves this project's build today. The numbered steps below record how that was set up, and are worth rereading only if the Worker is ever rebuilt from scratch.

One property of this setup is worth keeping in mind while authoring. Cloudflare builds on Linux, where filenames are case-sensitive; macOS is case-insensitive by default, so a file renamed only by case (`CV.md` → `cv.md`) keeps its old name in git while looking correct locally, and `npm run quality` passes on your machine while the Cloudflare build fails on a route it cannot find. `git mv -f old new` records such a rename properly. To check a commit the way Cloudflare will see it, build from a clean checkout of it rather than from your working tree:

```sh
git worktree add --detach /tmp/fresh HEAD
ln -s "$PWD/node_modules" /tmp/fresh/node_modules
(cd /tmp/fresh && npx svelte-kit sync && npm run build)
git worktree remove /tmp/fresh
```

1. In the Cloudflare dashboard, go to **Workers & Pages → Create application**, connect the Cloudflare GitHub App to `Orkking2/website` (or reuse an existing installation), and let it create a Worker (this is the correct, expected path — don't redirect to the Pages tab).
2. Set the build configuration:
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (Cloudflare's default; it reads `wrangler.jsonc`, so no build-output-directory field is needed here)
   - **Root directory:** `/`
   - No environment variables are required for public content.
   - **Node version:** `24.20.0` (an `.node-version` file is already committed; add a `NODE_VERSION` environment variable of the same value if Cloudflare doesn't pick it up automatically). This repo was previously pinned to the Node 22 line and hit two chained failures worth knowing about if a future Node bump reintroduces them: `22.22.2` shipped with a broken bundled npm (missing internal `promise-retry`, fixed in `22.22.3` — see Node's own changelog, `deps: upgrade npm to 10.9.8`), and separately `packageManager`'s pinned `npm@12.0.2` requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` — Node 24 (the current Active LTS line) clears both issues at once rather than chasing a narrow compatible patch within Node 22.
3. Save and deploy. The first build runs against `main` immediately and becomes the project's production deployment at its `*.workers.dev` subdomain.
4. `wrangler.jsonc` already declares `routes: [{ pattern: "nebve.com", custom_domain: true }]`, so the next deploy after this is pushed attempts to attach `nebve.com` automatically — no manual dashboard click needed, per [Cloudflare's Workers custom-domain guide](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/). This only succeeds if the Cloudflare account running this deploy is the same one that owns `nebve.com`'s DNS zone (Cloudflare's docs: "You cannot create a Custom Domain on... a zone you do not own"); D-008 in `docs/implementation-plan.md` flags that this hasn't been confirmed. If the deploy fails or the domain doesn't attach, check that first. The `www` hostname and the `*.workers.dev` subdomain still need a deliberate decision (redirect to `https://nebve.com`, or stay inactive) — neither is configured yet.
5. From then on, every push to `main` triggers a new production build and deploy with no further action; every other branch and pull request gets its own preview-deployment URL from the same connection. `static/_headers` sets `Cache-Control: public, max-age=0, must-revalidate` on HTML so a reload after a deploy always serves the new build, while hashed `/_app/immutable/*` assets are cached for a year since a new build gives them new filenames. Both `_headers` and `_redirects` in `static/` are honored by Workers static assets the same way they were under Pages.

Local sanity-checks before pushing: `npx wrangler deploy --dry-run` validates `wrangler.jsonc` and lists what would be uploaded without deploying anything; `npm run deploy` runs the real `wrangler deploy` (requires being logged in via `npx wrangler login` first) if a manual deploy from a local machine is ever needed outside the GitHub-connected flow.

Indexing stays off (`site.indexable = false` in `src/lib/data/site.ts`, `noindex, nofollow` metadata, `robots.txt` disallow) until Nicolas explicitly flips it — attaching the domain makes the site reachable, not indexed.
