# Authoring guide

- **Status:** active
- **Owner:** Nicolas
- **Started:** 2026-09-07

Every page on this site is a Markdown file under `src/content/`. There is no route to write, no list to register in, and no manifest to keep in step. Add a file, and it is a page.

## The tree is the site

`src/content/` works the way a directory of a website does, and the way a Rust module tree does: position is the declaration.

| File                                                | Page                                  |
| --------------------------------------------------- | ------------------------------------- |
| `src/content/index.md`                              | `/`                                   |
| `src/content/about.md`                              | `/about`                              |
| `src/content/writing/index.md`                      | `/writing`                            |
| `src/content/writing/ubq/index.md`                  | `/writing/ubq`                        |
| `src/content/writing/photography/worn-with-time.md` | `/writing/photography/worn-with-time` |

Three rules follow from that:

- **A directory is a page.** It must contain an `index.md`, which is what the directory serves at its own path — exactly as `index.html` does. A directory without one is refused, naming the directory.
- **A directory can hold anything, to any depth.** When `ubq.md` outgrows a single file, make it `writing/ubq/index.md` and put its further writing beside that index. The path `/writing/ubq` does not change, and neither does anything that links to it.
- **A name beginning with `.` or `_` is not part of the tree.** That is how the photograph library lives at `src/content/photography/.photogrid/` — masters and records that power `<PhotoGrid />` without becoming pages of their own.

`foo.md` and `foo/` cannot both exist at the same level; one path, one page.

## Writing collections

Writing has one canonical tree: `writing/ubq/`, `writing/lubq/`, and `writing/photography/`. The Photography page remains the gallery and lists the photo essays from Writing. Each directory’s `index.md` introduces its subject and uses `<Entries from="/writing/ubq" />` to list its children. `<Entries from="/writing" grouped />` generates the project-by-project lists on the Writing index; adding a directory does not require another registration.

Each article gets its collection’s reading list automatically, with the current article marked. Reading lists, `<Entries>` (including grouped collections), and header/footer navigation all use newest-modified-first ordering. A file directly under Writing remains a standalone entry in the unified index.

The filesystem supplies one canonical home and the default grouping. For a piece useful to several subjects, keep that one home and link to it with `<Entry from="/writing/ubq/head-packing" />` in another collection, or use the existing validated `related` list for a direct reading link. Do not duplicate the file. Multiple collection membership and richer automatic relationships are deferred until there is an actual example to design around.

Ordering is derived at build time; there is no `order` frontmatter field. A clean, committed `.md` or `.svx` page uses its latest Git commit's committer time. Saved local changes (including staged changes) and new files use their filesystem modification time. A source tree without Git history also uses file modification times. Merely touching an unchanged tracked file does not change its committed ordering. Use a checkout with full Git history for reproducible historical dates; a shallow clone can only resolve dates from its available history.

A directory uses the newest modification among its own `index.md` and all descendants, recursively. Hidden files, photographs, and other non-page assets do not affect that date. Equal timestamps sort by title, then route. Publication dates, `updated`, and `featured` do not override this order, and automatic modification times do not change the displayed first-publication or substantive-revision dates. Numbered lists derive their numbers from this sorted sequence. Photo-essay image sequences remain authored; the gallery still uses capture time.

The old project and photo-essay URLs redirect through `static/_redirects`. When moving another published file, update both its inbound references and its redirect.

## Frontmatter

Every page starts with YAML between `---` lines. Only two fields are required:

```yaml
---
title: Worn with time
summary: 'Are the things we repair not destined to be Thesean?'
---
```

Everything else is a facet you add when the page needs it. **A key you leave out simply does not apply to this page; a key you write and leave empty is unfinished work**, and is reported as such. `published: null` is a date you still owe. No `published:` at all is a page that is not dated.

| Field                        | What it does                                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                      | The page's name — in the header, the browser tab, and any index that lists it.                                                                                   |
| `summary`                    | The one-sentence orientation, used as the lede and the meta description.                                                                                         |
| `headline`                   | The `h1`, when the page opens with a sentence rather than its own name.                                                                                          |
| `eyebrow`                    | The small label above the heading. A nested page defaults to its parent's title.                                                                                 |
| `layout`                     | Omit for the broad, centered default. Only `home` needs a special layout. `index` and `article` are retired; `annotations: true` enables the rail independently. |
| `nav`                        | Whether the header links here. Top-level pages are listed by default; set `false` to keep one out.                                                               |
| `listed`                     | `false` keeps the page out of the sitemap and marks it `noindex`.                                                                                                |
| `published`, `updated`       | First publication and substantive revision, `YYYY-MM-DD`.                                                                                                        |
| `status`, `tags`, `featured` | A project's state, its topics, and whether an index leads with it.                                                                                               |
| `links`                      | `paper`, `code`, `docs`, `demo` — rendered as a resource list under the body.                                                                                    |
| `related`                    | Other pages this one develops, named by path: `['/writing/ubq']`.                                                                                                |
| `annotations`                | Turns on the article annotation rail.                                                                                                                            |
| `images`                     | Makes the page a photo essay. See below.                                                                                                                         |
| `cover`                      | The photograph the page opens with. See below.                                                                                                                   |
| `location`, `inProgress`     | Where a photograph was made, and whether the page announces itself as unfinished.                                                                                |

## Footnotes

Use a named reference and a matching definition in ordinary Markdown:

```markdown
The result depends on the workload.[^benchmark]

[^benchmark]: Describe the workload and link to the source here.
```

Notes are numbered by their first reference, regardless of where their definitions appear.
Reuse the same reference to cite a note again; each occurrence gets its own return link
from the footnote section. Definitions may contain links, emphasis, code, and additional
paragraphs indented by four spaces. A reference without a definition fails the content
check and build. Code examples and escaped markers remain literal text.

References and return links work with the keyboard and without JavaScript.

## Commands

| Command                                                            | What it does                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `npm run content:new -- /writing/some-idea --title "Some title"`   | Starts a page at a path. It refuses to overwrite an existing file.   |
| `npm run content:new -- /notes --title "Notes" --directory`        | Starts it as `notes/index.md`, so the page can hold children.        |
| `npm run content:check`                                            | Validates frontmatter, references, embeds, links, and accessibility. |
| `npm run content:revision -- /writing/some-idea --date 2026-09-07` | Proposes an `updated:` date. It changes nothing on its own.          |

## Finished, not flagged

Nothing a _page_ declares makes it a draft. A page is servable when it is complete — a summary, a body, a first-publication date if it claims one, a status if it claims one, an essay cover. `npm run dev` reports what is still missing and renders the page anyway, so you can write; `npm run build` and `npm run content:check` refuse. The gate on publication is `git push`, not a flag in frontmatter.

Photographs are the one exception, and for a reason: the library holds work in progress by design. A photograph is served only once it is marked **reviewed** in `npm run photos` and has alternative text. Until then it is unfinished and simply left out — no warning, no failed build. See [photography-intake.md](photography-intake.md).

## Marking a passage to rewrite

One thing a page can declare is that a passage is not yet in your own voice. Wrap it:

```markdown
<!-- Voice flag: reads as a symmetric tricolon -->

That paragraph.

<!-- /Voice flag -->
```

`npm run content:check` lists every open flag with its file and line, and an open flag counts as unfinished work — so a flagged passage refuses to build rather than shipping quietly. Delete both comments once the passage is rewritten.

This is for prose that is factually right but rhetorically wrong: writing that reads as generated rather than written. Two tells are worth the flag — three or four parallel clauses in a row, each with its own relative clause, and a concrete paragraph that closes on a generalizing, aphoristic sentence. Careful hedging is not the same thing; exactness is wanted.

## Embedding other pages

A few components are available in any authored Markdown file without an import. They exist for the one thing Markdown cannot express: showing part of another page as it currently stands, rather than a copy that will drift.

Anything named with `from` is a **path**, looked up in the page tree, so the title, summary, status, date, and destination always come from that page's own source file. Change `src/content/writing/ubq/index.md` and every page that embeds it follows.

### Reference

Use `to="/writing"` on a `<Section title="Writing">` to make the section heading itself a link. Home uses linked headings instead of separate index links.

| Tag                                                 | Purpose                                                                                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Section title="Writing">`                         | A numbered block. Numbers are generated in order of appearance, so reordering sections renumbers them. `layout="split"` sets the block's prose against its links.                       |
| `<Columns>`                                         | Places the sections inside it side by side, stacking on a narrow viewport.                                                                                                              |
| `<Featured from="/writing/ubq" link="Overview">`    | The largest treatment of one page. `label` prefixes the meta line. Write children only to say something that does not belong in that page's own summary.                                |
| `<Entries from="/writing" limit="3">`               | A numbered list of a directory page’s children: newest modification first, using the same order as the page tree. Add `grouped` to show each child directory with its own article list. |
| `<Entry from="/writing/some-slug">`                 | One row that links to a real page, labelled with its date or status.                                                                                                                    |
| `<Entry title="Head Packing" note="Working topic">` | One row for something not yet published. It links nowhere.                                                                                                                              |
| `<Link to="/writing">Writing index</Link>`          | A forward link in the index's style.                                                                                                                                                    |
| `<Links label="About and CV links">`                | A row of forward links, described for anyone navigating by landmark.                                                                                                                    |
| `<Count of="photographs">`                          | A live count, inline in a sentence. Sources: `photographs`, `essays`, or a directory page's path, as `of="/writing"`.                                                                   |
| `<PhotoGrid />`                                     | The gallery of reviewed photographs, wherever the page puts it. See below.                                                                                                              |
| `<Photo of="tombstone">`                            | One of this page's own photographs, at the article's width and clickable into the viewer. See below.                                                                                    |
| `<Notice title="Coming soon">`                      | An aside for work acknowledged but not done. The release check refuses to ship a launch build containing one.                                                                           |
| `<Figure src="…" alt="…" caption="…">`              | An image with a caption, for use inside an article.                                                                                                                                     |
| `<Annotation title="…">`                            | A collapsible aside in an article's annotation rail.                                                                                                                                    |

Ordinary HTML works too, and picks up the site's styles — `<section class="workbench">` and the rest are global. That is the escape hatch when a page wants a shape no component covers.

### Article figures

Keep a diagram beside the article and reference it directly:

```svelte
<Figure src="./UBQ Visualization.drawio.svg" alt="UBQ queue visualization" />
```

No import block, frontmatter image map, or manual dimensions are needed. Paths are relative to the Markdown file; spaces in filenames work. Shared assets can use `../`, within `src/content/`. An asset folder should start with `_` (for example `_figures/`) so it is not treated as a page. A root-relative path such as `/images/diagram.svg` instead resolves inside `static/`.

`Figure` fills its available container width and preserves the image's proportions. The build reads intrinsic dimensions to reserve space before loading; `width` and `height` are not required layout controls. Add `caption="…"` for a caption and `pdf="/documents/diagram.pdf"` for an optional PDF link. Describe the figure in `alt`; use `alt=""` only for a decorative image, and explain complex diagrams in nearby prose.

SVGs stay vector images, including editable draw.io SVG exports. PNG, JPEG, and WebP figures use the photograph pipeline's responsive width selection and metadata checks, generating lossless WebP with PNG fallbacks that preserve transparency. These outputs live in the ignored, generated `static/images/figures/` directory. Commit the source image with its article. Changes to a source produce a new asset URL, and unused generated assets are removed on the next build.

Use `<Photo of="…" />` for reviewed library photographs; their editorial records, watermarks, and viewer remain part of the photograph workflow. A figure cannot reference a `.photogrid` master directly. Local figures are validated for file containment, supported format, embedded metadata, and alternative text. Authored expression sources (`src={importedImage}`) and external URLs still work, but automatic preparation applies to literal local paths only; those other sources need their own dimensions. The optional `sizes` attribute overrides the browser's raster size hint when a custom layout needs it.

### The photograph gallery

`<PhotoGrid />` places the gallery, and the clicking-through viewer that goes with it, wherever the page wants it. It reads the library at `src/content/photography/.photogrid/`, so the page decides only where the grid sits, not what is in it. `npm run photos` is what edits the library, and only photographs marked reviewed there appear.

A photograph whose record names a page — `"photoEssay": "/writing/photography/worn-with-time"` — carries a `.txt` reading link below it. Titles are burned into the top-left of generated images; captions and approved location labels appear below. `Link to photograph` uses `/photography#photo-ID`, and opening the viewer updates that URL. Reloading or sharing it opens the same photograph. The unenhanced page still locates the image and provides an ordinary `Open image` link.

### Photo essays are collections

A page that names photographs is a photo essay, wherever it sits in the tree. The name is local to that page, so two photographs may share a title and still be addressed separately:

```yaml
images:
  tombstone: photo-3b949334809c
  worn-steps: photo-864bd0829d56
cover: tombstone
```

Order is the order you write them in, and `cover` names one of them. In the body, place a photograph where the argument needs it, and link to it from anywhere on the page:

```markdown
That last one is what we observe in [the tombstone below](#tombstone).

<Photo of="tombstone" />
```

The name doubles as the link target, so `#tombstone` works without writing an id by hand. Any photograph you do not place yourself closes the page, in the order you named it — so an essay of six photographs with no `<Photo>` tags still reads as a sequence.

A placed photograph takes the same width as the writing around it, so the column reads as one, and clicking it opens the same viewer the gallery uses — previous/next, Escape to close, and a URL that reopens it. Without JavaScript the frame is still a link to the largest display variant. Photographs prepared with a full-resolution lossless master also show a separate watermarked WebP download link, with its file size, both here and in the gallery and viewer.

`npm run photos` edits the same list, and is the intended way to import a photograph into an essay, name it, reorder, and choose the cover. It writes all of that back into this frontmatter. Renaming there also rewrites `<Photo of="…">` and `#name` links in the body, so a rename cannot quietly break the page.

This map is the **only** record of which photographs an essay holds. A photograph's own file says nothing about which essay it belongs to; that direction is worked out by reading the essays, so there is one place to change and nothing to keep in step.

### A page can open with a photograph

`cover` names the photograph a page opens with. A page without photographs of its own names one from the library by its ID:

```yaml
title: Photography
summary: 'A hub to see all my photographs.'
cover: photo-2481017f1052
```

The photograph is held in a band under the site header, and the writing scrolls up over it on the site's black: a visitor gets the header, then the photograph, then the page. Nothing moves on its own, so there is nothing to withdraw under `prefers-reduced-motion`.

The band is the width of the writing, and every cover is cropped into it, so a page's opening does not change shape with the picture it names. Its height is whatever the header and an opening's worth of writing leave on the first screen, up to 4:3 — which is the shape these photographs are taken in, so on a roomy screen a landscape cover is barely cropped at all and carries its provenance mark whole. A shorter window crops further rather than pushing the band past the fold.

The crop is even on both edges, so a cover keeps the middle of its photograph. Choose one for what its middle says, and expect a portrait cover to give up a great deal — and, with the top and bottom of the frame gone, to carry a partial provenance mark or none. The same photograph still carries a whole one wherever it is shown at its own shape.

A page with a cover also opens tighter than one without. The shell's usual gap above the heading is there to set a bare page down from the header; a cover has already done that, so it shrinks, and the heading arrives at four fifths of its size and grows to full over the band's height. That last part is decoration and behaves like it: no scroll-driven animation, or `prefers-reduced-motion`, and the heading is simply full size from the start.

A cover is served from the same responsive variants as the gallery, provenance mark included, so it needs no separate asset and nothing new is published about it.

An essay's `cover` still names one of the essay's own photographs, and there it does not produce a band: those photographs are on the page already, placed where the writing wanted them or closing it, and a page should not print the same photograph twice. So in practice the band belongs to a page that names a photograph it does not otherwise show, which is what an index does.

Unfinished photographs are skipped here as everywhere else: a cover naming a photograph that is not yet reviewed leaves the page without a band rather than failing the build. Naming an ID the library does not hold _is_ an error, because that is a mistake rather than work in progress.

### Layout rules

Leave a blank line above and below a tag that wraps Markdown, and do not indent it — four spaces makes a code block:

```markdown
<Section title="Photography">

A filterless gallery preserves the proportions of <Count of="photographs" noun="selected photograph" />.

<Link to="/photography">Photography index</Link>

</Section>
```

Inside a column, aim for three children — heading, content, and a closing link — so the closing link stays pinned to the bottom of the column.

### What is checked

`npm run content:check` fails, naming the file and line, when a directory has no index, when a file and a directory claim the same path, when a tag names a page that does not exist, when `<Entries>` names something that cannot have children, or when a `to` path is not a route on this site. It also reports every page that is not yet finished, naming the field, and every open Voice flag.

It compiles each page exactly as the build does, so an accessibility warning from the Svelte compiler — an image without alternative text, a label with nothing to label — fails the check on the file that caused it.

Examples inside fenced or inline code are ignored, so this guide's own samples are not treated as authored markup.

### Adding a component

The list is deliberately short. Widening it means adding a name to `contentComponents` in `scripts/content/components.ts`, writing the component under `src/lib/components/content/`, and documenting it above. Only components on that list are imported into Markdown, and only the ones a file actually uses.
