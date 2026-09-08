# Growing the photograph gallery

Status: proposal for Nicolas, 2026-09-08. This is a plan for discussion; archive navigation and search have not been added.

The current library contains eight records, six selected for the gallery. The build emits responsive JPEG and WebP variants; gallery images below the first use native lazy loading. The viewer creates one image at a time. The direct fallback is now the largest responsive JPEG, capped at 2400 pixels wide. These measures bound individual image downloads; they do not bound the length of the gallery HTML or make a particular photograph easy to find.

## First expansion: a chronological archive

Keep the current gallery as the entry point, showing a finite recent selection. Add a compact line of years, followed by ordinary Previous / Next links on finite archive pages. A starting page size of 24 photographs is a prototype choice to check with the actual images. Capture order stays newest first; exact timestamps need not become interface labels.

Generate each archive page as static HTML. Its photographs, captions, and page links work without JavaScript. A visitor can resume at a known page, follow a year directly, and reach the end of a page. Avoid making infinite scrolling the only way to navigate.

The implementation should give each photograph a small permanent page, such as `/photography/photo-ID`, independent of the year/page where it is currently listed. Opening it from a grid may still use the existing viewer. Preserve existing `/photography#photo-ID` links with a compact ID-to-destination lookup so older shared links continue to work after the recent selection changes. Until that migration exists, do not remove older images from the current fragment-addressable gallery.

## Finding an image

Visible captions make browser Find useful now, within the loaded page. It does not search unloaded archive pages.

Once browsing by year proves insufficient, add one plain search field labelled “Find a photograph”. Build a small index from approved titles, captions, and location labels. Download it only when search is used. Return image thumbnails with their existing text and permanent links; preserve a query in the URL. Empty results should say that no photographs match the query, with a clear way to return to the gallery.

This can remain a static feature: no search service, visitor account, analytics, or generated image descriptions. Alternative text should retain its accessibility purpose and must not be padded with keywords. Do not expose coordinates or private source metadata through search. For a much larger collection, split the index by year only when measurements justify it.

## What to measure before choosing the boundary

Use temporary fixtures, not invented public photographs, to inspect 100 and 1,000 gallery records. Check initial transferred bytes, image requests, DOM size, layout shifts, scroll responsiveness, and keyboard travel on a narrow screen. Confirm that a shared image can be found without downloading the full collection.

Also measure the build: image variants are cached by source and watermark content, so renaming a title deliberately regenerates that image’s derivatives. If build time becomes significant, retain that cache in CI; keep outputs reproducible from committed sources.

## Fit with the site

The interface can use the typography, simple links, and numbered lists already present: a year index, a photograph’s own caption, and direct destinations. Photography remains a place to browse images, and essays remain part of Writing. Collections can be introduced later when Nicolas supplies an editorial grouping; the existence of camera metadata does not require a filter panel.
