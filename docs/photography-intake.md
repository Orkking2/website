# Photography

- **Status:** active
- **Owner:** Nicolas
- **Last updated:** 2026-09-08

## The library

`.local/photography/` is the library. It is Git-ignored, it holds the original files exactly as they came off the phone, and **nothing ever copies or edits them**. Put a photograph there and this site hosts it; take it out and it stops being offered.

Placing a file in that folder is the selection. There is no second decision to make, no flag to set, and no promotion step. Organise it into whatever subfolders you like — the whole tree is read.

`.local/photography/.data/` is reserved. It caches, keyed by content hash, the derived data and previews for each photograph so a rescan costs one `stat` per unchanged file. Deleting it is safe; the next run rebuilds it, slowly.

## The studio

```
npm run photos
```

Scans the library, then serves a private, loopback-only workspace on `127.0.0.1`, protected by a per-run token, and prints its address the way the dev server does. Nothing is opened for you: click the address, or keep a tab pointed at it. Because the token is minted per run and embedded in the page, a tab left open across a restart reloads itself once to pick up the current one. Everything you type saves straight into `src/content/photography/.photogrid/records/`, which is ordinary tracked source.

It has three sections:

- **Unfinished** — everything not yet published: not marked reviewed, or still missing data.
- **Ready** — reviewed and complete. These are the photographs the site serves, still fully editable.
- **Essays** — every photo essay with its photographs in order. Import the ones an essay is about, name each one, drag to reorder, and choose the cover. See "Essays own their photographs" below.

Useful flags: `--port <number>` (default 4179, so a bookmarked tab keeps working), `--open` to launch a browser as well, `--prune` to drop cache entries for photographs that have left the library, `--library <path>` to point at a different library, and `--yes` to skip the bulk-read confirmation.

The one confirmation it asks for is not editorial. A new photograph writes a publication master into the repository, and those are committed permanently, so a first run over more than 25 new files tells you how much history that adds before it starts.

## Unfinished, then reviewed

There is exactly one stage between putting a file in the library and publishing it, and a photograph is **unfinished** for both halves of it: while you have not marked it **Reviewed**, and while its data is incomplete. Neither is an error. A library is expected to hold work in progress, so an unfinished photograph is simply left out — `npm run build` succeeds and the site is built without it.

Marking a photograph reviewed is the whole gate. The one thing that must be there first is **alternative text**, or an explicit mark that the image is decorative: that is what a screen reader has instead of the photograph, so it is not a matter of taste. A title is required too, but it fills itself in as `Untitled` rather than standing in your way. Everything else — caption, place, coordinates, gallery inclusion, essay — is content you write or leave alone.

The one thing that _is_ reported is a photograph marked reviewed whose data is still incomplete, because that is a claim about it that is not true. `npm run content:check` names it and the build refuses.

The capture date and time are read from the file and shown for editing. Saving is confirming; there is no separate tick.

### Alternative text and caption are different jobs

They are easy to confuse, because a caption is often descriptive too.

- **Alternative text** _replaces_ the photograph for someone who cannot see it. Describe what is in the frame.
- **The caption** is printed under the photograph _for everyone_, alongside the image rather than instead of it. It carries what a viewer could not work out by looking.

If the two are identical, a screen reader reads the same sentence twice; the studio says so when it sees that.

## Filling in what an older record is missing

A record written by an earlier pipeline can be missing data the original has carried all along — coordinates most of all, which used to be stripped on the way in. The studio fills these in for itself: it reads the cache first, and the original only if the cache is silent too, and it never overwrites anything already written. A blank field is missing data; a field you cleared on purpose is one you can clear again.

When an original cannot be read the failure is **soft, and reported on that photograph**: the card and its editor say what went wrong, and every other photograph in the library still loads.

A photograph taken with location services off carries no GPS at all, so there is nothing to recover. The studio says so on that photograph rather than leaving a blank pair of fields that looks like a broken autofill, and it does not decode the original again on every run to re-learn it.

## The watermark

Every image this site serves carries, burned into its pixels:

```
nebve.com 52°21'29.7"N 4°52'50.8"E 03 Jul 2026 19:52:06
```

Black text with a white outline, bottom left. The coordinate segment is omitted entirely when a photograph has none, and clearing both coordinate fields in the studio removes it.

Two things about how it reads. Coordinates are in **degrees, minutes and seconds**, latitude first, because that is how a place is written on a map and said aloud — and the hemisphere letter carries the sign, so there is no minus to misread. The **month is spelled out**, so `03 Jul 2026` cannot be read as the seventh of March the way `03-07-2026` can.

Three things about how it is applied:

- It is drawn **after** each resize, at a size proportional to that output, so the text is rendered at the size it will be seen at rather than being downsampled along with the photograph. It stays legible at 480 pixels and at 2400.
- The white outline is what makes it survive lossy compression. Black alone disappears into a dark photograph, and JPEG at quality 86 smears thin dark strokes; the outline gives the encoder a high-contrast edge to preserve. `scripts/photos/variants.test.ts` asserts the mark is present and that the rest of the frame is untouched.
- The committed master in `src/content/photography/.photogrid/masters/` is **clean**. The mark is applied when variants are built, so correcting a date or a coordinate re-marks every served size without going back to the original file.

Because the mark is part of what a served file is, the watermark settings and text are part of the variant cache key: change either and every size rebuilds under a new name.

> Exact coordinates in the mark are a permanent, public disclosure of where a photograph was taken. A copy someone downloads keeps them. Clear the coordinate fields for anything shot somewhere you would not publish the address of.

## What reaches the repository

| Location                                      | Contents                                                   | Tracked |
| --------------------------------------------- | ---------------------------------------------------------- | ------- |
| `.local/photography/`                         | Originals, untouched                                       | No      |
| `.local/photography/.data/`                   | Hash-keyed cache and previews                              | No      |
| `src/content/photography/.photogrid/masters/` | Bounded sRGB JPEG masters, no EXIF, no GPS, no device data | Yes     |
| `src/content/photography/.photogrid/records/` | The public record for each photograph                      | Yes     |
| `src/content/writing/**/*.md`                 | Which photographs an essay holds, and their names          | Yes     |
| `static/images/photography/`                  | Watermarked variants, generated at build                   | No      |

Masters are capped at 3200 pixels at quality 0.92 and stripped of all embedded metadata. `npm run photos:guard` and the `--source-only` check in `npm run build` scan for private paths and original filenames leaking into tracked files or build output.

## Publishing

`git push`. That is the gate. The site rebuilds from what is committed.

## Essays own their photographs

Which photographs belong to an essay is kept in **one place: the essay's own `images:` map**, which pairs a name you choose with a photograph's ID. Nothing is written into the photograph's record, so there is no second copy to keep in step, and the gallery's `.txt` reading link is worked out by reading the essays.

The studio is how that map is edited, because it is the only place a photograph can be recognised by looking at it rather than by its ID:

- **Import** adds a photograph to an essay, naming it after its title.
- **The name** is what the essay's prose refers to — `<Photo of="tombstone" />`, and `#tombstone` as a link target. Renaming it in the studio also rewrites those references in the essay's body, so a rename cannot quietly break the page.
- **Order** is the order the essay presents them in; **cover** names one of them.
- **The photo essay field** in a photograph's own editor moves it between essays, writing only the essay files.

An essay that names an unfinished photograph is reported by `npm run content:check`, since the page would otherwise render a gap where an image belongs.

## Gallery presentation and links

Gallery order is the order the photographs were taken, newest first, computed from each capture time and its UTC offset so the comparison is between real instants rather than wall-clock readings. The grid fills the way English reads — left to right, then down — so that order is the order a reader meets. It was a multi-column layout until 2026-09-08, which filled each column top to bottom first and made a correctly ordered gallery read as unordered.

The columns are dense — each stacks on its own, so a portrait stands beside a landscape with no gap under the shorter one and neither is cropped. Which column a photograph lands in is decided when the page is built, by giving it to whichever column is shortest so far. That is what keeps the order readable: dealing strictly left, right, left would let one column collect the short photographs and run away from the other, and everything below that point would read out of step. Choosing the shortest holds the two within one photograph's height of each other however many are added, so a mismatch stays local instead of accumulating.

Two consequences worth knowing. The markup is ordered by column rather than by date, so the viewer's Previous and Next follow the sequence each frame records rather than the markup, and a screen reader or a Tab key meets the left column before the right — a coherent reading of two columns, but not the order the photographs were taken. And at one column the wrappers stop being boxes, so every photograph becomes an item of the gallery again and the recorded sequence puts them back in order. As of 2026-09-08, titles are embedded into the top-left of each generated variant using the existing watermark style. Changing a title regenerates both studio previews and served variants. Captions and approved location labels appear below the image, alongside its stable link and any `.txt` essay link. Photo essays live under `src/content/writing/photography/`; the gallery library remains in `src/content/photography/.photogrid/`.

Photographs placed in an essay open that same viewer, and the page shell carries it wherever there are photographs to look at — so a page with neither ships no viewer and no script.

A photograph can be shared as `/photography#photo-ID`. IDs survive title edits, reordering, and regenerated image filenames. Viewer navigation replaces the selected photo in the URL, and reloading restores it. The largest served image is 2400 pixels wide; the master is not used as the browser fallback.
