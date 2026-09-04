# nebve.com

Nicolas's personal website for research and projects, technical writing, photography, and a web-readable CV. The repository is the content source of truth; SvelteKit prerenders it to static files for Cloudflare Pages.

The active implementation sequence, approval gates, content dependencies, and decision log are maintained in [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Current status

This is a local, content-first prototype—not a launch-ready site.

- The approved information architecture and five-item primary navigation are implemented.
- Home, About Me, Research & Projects, UBQ, Writing, Photography, Photo Essays, CV, and a real 404 page are prerendered.
- Nicolas's formal proposal informs the visitor-facing purpose, audiences, quality criteria, and progressive UBQ reading path; the authority map is recorded in `docs/vision.md`.
- The site's voice, visual identity, interaction language, photography behavior, and target Markdown authoring workflow are approved and recorded in `docs/voice-and-identity.md`.
- Pages use explicit `noindex, nofollow` metadata, and `robots.txt` blocks crawling.
- The proposal supports UBQ's general subject and in-progress status. No expanded name, contribution, architecture, results, performance claims, resource links, personal history, contact details, articles, photographs, CV facts, or downloadable CV have been invented.
- The warm neutral/green theme, large hero, card treatment, background grid, and `N` favicon are provisional and conflict with the approved identity. They remain only because the identity has not yet been implemented.
- The repository is connected to GitHub at [`Orkking2/website`](https://github.com/Orkking2/website); pushes to `main` are meant to drive the Cloudflare Pages production deployment once it's connected (see "Deploying to Cloudflare Pages" below). Cloudflare Pages itself has not been connected yet — that step needs an interactive dashboard login and is Nicolas's to complete.

## Local development

Prerequisites:

- Node.js `22.23.2` (recorded in `.node-version`)
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

## Private photography intake

Phone exports stay outside the repository. The local intake workflow copies them into a Git-ignored inbox, hashes and deduplicates them, reads capture/privacy warnings, creates orientation-correct review images, and supports continuous local review plus explicit draft promotion:

```sh
npm run photos:spike -- /absolute/path/to/export-folder
npm run photos:import -- /absolute/path/to/export-folder --batch summer-2026
npm run photos:review -- --batch summer-2026
npm run photos:promote -- --batch summer-2026 --dry-run
```

See [`docs/photography-intake.md`](docs/photography-intake.md) before importing or promoting photographs. Import and review never publish media; promotion creates only unreferenced draft source records and sanitized masters outside `static/`.

## Architecture

- Framework: SvelteKit with TypeScript
- Rendering: static prerendering with SSR kept on during the build and client-side rendering disabled for the current non-interactive prototype
- Adapter: `@sveltejs/adapter-static` with strict prerender validation
- Output: `build`
- Content: authored data in `src/content/catalog.json`, checked by the typed build-time model in `src/lib/content/catalog.ts`; no database, CMS, API, or runtime content fetch
- Editorial direction: `docs/vision.md` records the authority map; `docs/voice-and-identity.md` is the approved voice and identity standard
- Route manifest: `src/lib/data/routes.json`, shared by navigation, discovery files, and output verification
- Canonical origin: `https://nebve.com`

Dynamic Writing and Photo Essay routes export their published slugs for prerendering. Their route templates are the only unseen routes permitted when those collections are empty; every real published entry must still generate static output.

The project follows the official [SvelteKit static-site guidance](https://svelte.dev/docs/kit/adapter-static). Cloudflare's generic SvelteKit preset normally suggests `.svelte-kit/cloudflare`; this repository deliberately uses the static adapter, so the Pages output directory must be `build`.

## Content needed next

The most useful next step is an owner-approved content packet:

1. Rewrite the proposal-backed homepage language in the approved public voice as real content becomes available.
2. Supply a short biography, experience preview, and approved contact/profile links.
3. Supply the authoritative UBQ overview, Nicolas's contribution, API and architecture details, and paper, code, and docs.rs URLs.
4. At least one finished writing entry with summary and real publication date.
5. A selected group of photographs with order, aspect-ratio/crop decisions, alternative text, captions, and approved public metadata.
6. Structured CV facts and the reviewed PDF filename.
7. Owner review of the remaining prototype gates: exact colors, typography metrics, link motion, article rail, gallery spacing, and photo-essay transition.

Draft metadata belongs in the typed catalog with `draft: true`. Published project entries must have a summary and status; writing and photo essays require valid dates; related-project references, URLs, image paths, dimensions, capture date/time, optional coordinates, and alternative text are checked during the build. Gallery images are ordered newest first by capture time. Photo-essay images may also carry a distinct `context` paragraph array so narrative text does not have to double as a caption or alternative text.

## Launch checklist

Before making the site public:

1. Remove every editorial placeholder and approve the public copy. The build rejects placeholder-marked surfaces when indexing is enabled.
2. Add responsive photographs and the reviewed CV PDF.
3. Implement the approved identity and replace the provisional favicon with the lowercase `n` treatment.
4. Add and review a social-preview image.
5. Confirm the `LICENSE` attribution (`Orkking2`) is intentional.
6. Change `site.indexable` in `src/lib/data/site.ts` only after featured content is no longer draft. This automatically enables indexable metadata, `robots.txt`, and populated sitemap entries; the launch guard rejects an indexable build with a draft featured project.
7. Run `npm run quality` and inspect a Cloudflare Pages preview at mobile and desktop sizes.

## Deploying to Cloudflare Pages

The GitHub repository ([`Orkking2/website`](https://github.com/Orkking2/website)) is the source of truth; Cloudflare Pages still needs to be pointed at it once. That first connection requires an interactive login to the Cloudflare account that manages `nebve.com`'s DNS, so it has to happen in the dashboard rather than from here — see D-008 in `docs/implementation-plan.md` for why the account to use isn't settled yet.

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Import an existing Git repository**, and connect the Cloudflare GitHub App to `Orkking2/website` (or reuse an existing installation).
2. Set the build configuration:
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
   - **Node version:** `22.23.2` (an `.node-version` file is already committed; add a `NODE_VERSION` environment variable of the same value if Cloudflare doesn't pick it up automatically). Avoid `22.22.2` specifically — that patch shipped with a broken bundled npm (missing internal `promise-retry` module, reported against Heroku, GitHub Actions, and npm/cli independently of Cloudflare) that fails any `npm install`/`npm ci`; it was fixed in `22.22.3`. `packageManager` in `package.json` pins `npm@12.0.2`, which itself requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` — so within the Node 22 line, any patch from `22.22.2` onward satisfies it, but only `22.22.3+` avoids the bundled-npm bug.
   - No environment variables are required for public content.

   Cloudflare's generic SvelteKit preset suggests `.svelte-kit/cloudflare` as the output directory — that's the output of `@sveltejs/adapter-cloudflare`. This project deliberately uses `@sveltejs/adapter-static` instead, so the output directory must stay `build`.

3. Save and deploy. The first build runs against `main` immediately and becomes the project's production deployment at its `*.pages.dev` subdomain.
4. Once that first build succeeds, open the project's **Custom domains** tab and attach `nebve.com`, following [Cloudflare's custom-domain guide](https://developers.cloudflare.com/pages/configuration/custom-domains/). Decide deliberately what the `www` hostname and the `*.pages.dev` subdomain should do (redirect to `https://nebve.com`, or stay inactive) rather than leaving several canonical-looking hostnames live at once.
5. From then on, every push to `main` triggers a new production build and deploy with no further action; every other branch and pull request gets its own preview-deployment URL from the same connection. `static/_headers` sets `Cache-Control: public, max-age=0, must-revalidate` on HTML so a reload after a deploy always serves the new build, while hashed `/_app/immutable/*` assets are cached for a year since a new build gives them new filenames.

Indexing stays off (`site.indexable = false` in `src/lib/data/site.ts`, `noindex, nofollow` metadata, `robots.txt` disallow) until Nicolas explicitly flips it — attaching the domain makes the site reachable, not indexed.
