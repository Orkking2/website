# Private photography intake

The photography authoring workflow is local and batch-oriented. It is not a site route,
CMS, upload API, or backup system. Phone originals, exact source names, content hashes,
raw capture timestamps, private coordinate suggestions, and metadata-presence warnings stay under
**.local/photography/**, which is ignored by Git and guarded from **static/** and
**build/**.

The importer never edits, moves, or deletes its source folder. Its inbox is a working
copy, so transfer and back up the phone export before using these commands.

## Toolchain decision

The intake toolchain deliberately separates metadata from pixels:

- Apple ImageIO reads HEIC, JPEG, and PNG dimensions, orientation, capture timestamps,
  explicit UTC offsets, color-profile names, exact latitude/longitude suggestions, and
  metadata-presence flags. Coordinates remain in the private manifest. The helper never returns
  camera serials, face regions, or other raw metadata values.
- **heic-decode 2.1** uses the maintained libheif WebAssembly decoder for HEIC pixels.
- **sharp 0.35** handles JPEG and PNG pixels, bounded resizing, JPEG output, sRGB
  tagging, and output metadata inspection. It is also the intended foundation for
  later reproducible responsive variants in CI.

Apple ImageIO and the packaged libvips HEVC decoder both produced unusable pixel output
for the representative files on the development machine, although they could read
metadata. The spike therefore keeps Apple ImageIO only for metadata and uses the
libheif WebAssembly decoder for HEIC pixels. Near-uniform output detection prevents the
same failure from passing silently in the future.

The ImageIO helper is compiled locally with the macOS system Objective-C compiler and
cached only under **.local/photography/.tools/**. The static site build never needs the
private originals or the Apple helper. Promoted source masters are ordinary, bounded
JPEG files outside **static/**.

The implementation follows Apple’s ImageIO metadata and orientation model and sharp’s
documented defaults: output metadata is removed unless explicitly retained, auto
orientation removes the orientation tag, and an inside resize preserves aspect ratio.

## 1. Transfer and back up a batch

Export the intended photographs from the phone into an ordinary folder on the computer.
Keep that folder in the normal backed-up photo archive. Import is not a replacement for
the archive.

Do not place the export under this repository or in **static/**.

## 2. Run the read-only toolchain spike

Run this before the first import from a new phone/export configuration:

    npm run photos:spike -- /absolute/path/to/export-folder

For machine-readable aggregate output:

    npm run photos:spike -- /absolute/path/to/export-folder --json

The spike hashes inputs, creates temporary orientation-correct review images, checks
for near-uniform decoder failures, summarizes formats/orientations/profiles/timestamps,
and reports only aggregate counts for readable coordinates and GPS/device/XMP presence. It never
prints the coordinates themselves. Temporary outputs are removed when
the command ends.

### Representative private-batch result

The 2026-09-04 run exercised 27 unique HEIC inputs totaling 49.4 MiB. Aggregate findings:

- all source pixel matrices were 4032 × 3024 and tagged Display P3;
- 10 used orientation 1 and 17 used orientation 6;
- capture suggestions spanned 2026-07-02 through 2026-09-02;
- every file contained an explicit capture-time offset;
- every original contained GPS, device, and XMP metadata;
- all 27 originals supplied readable private latitude/longitude suggestions;
- all 27 generated review images had the intended oriented aspect, unique pixel output,
  an sRGB profile, and no EXIF, GPS, IPTC, XMP, comments, or device metadata;
- HEIC, JPEG, and PNG paths all decoded successfully in separate runs.

No coordinate or camera value was written to versioned files. Exact visual
Display-P3-to-sRGB comparison in Safari and Chromium remains a prototype gate before
any lasting publication setting is approved.

## 3. Import a batch

Choose a stable private batch name:

    npm run photos:import -- /absolute/path/to/export-folder --batch summer-2026

Import recursively:

- computes SHA-256 before copying;
- keeps one private original and one review record per exact content hash;
- records repeated files in the same source and duplicates found in other local batches;
- preserves original names and relative paths only in the private manifest;
- copies RAW, video, adjustment-sidecar, and unknown files into the private inbox with
  explicit warnings instead of silently discarding them;
- identifies a video with the same folder and stem as an image as a possible Live Photo
  companion;
- creates 1600-pixel-bounded, orientation-correct sRGB JPEG review images;
- records capture time, timezone, and coordinates as private suggestions, not approved public facts.

The resulting private structure is:

    .local/photography/summer-2026/
    ├── manifest.private.json
    ├── originals/
    └── thumbnails/

Re-running the same command is safe. Existing content hashes and stable review IDs are
reused, missing private files are restored, and duplicate originals are not created.
To re-read metadata or regenerate review images after a toolchain change:

    npm run photos:import -- /absolute/path/to/export-folder --batch summer-2026 --refresh-metadata

## 4. Review

Start the loopback-only workspace:

    npm run photos:review -- --batch summer-2026

The server binds only to **127.0.0.1**, uses a per-run private request token, sends a
same-origin content-security policy, and does not expose source paths. Stop it with
Ctrl+C.

The contact sheet is capture-time ordered. Use Left/Right to move and 1/2/3 to choose
Select, Hold, or Reject. Every field change is saved atomically to the ignored manifest.
The incomplete count covers undecided records and the requirements attached to a
selected draft.

Review fields remain distinct:

- stable ID;
- optional title;
- caption plus an explicit “caption reviewed” decision, so blank can be intentional;
- draft alternative text, or an explicit decorative decision;
- required local capture date/time, optional UTC offset, and a separate review decision;
- optional human-written public location label;
- private latitude/longitude suggestions and an explicit per-image “include coordinates” choice;
- gallery inclusion; the public gallery sorts automatically by capture time, newest first;
- optional canonical photo-essay slug.

Linking an existing essay is supported by slug. Scaffolding new canonical Markdown
essays is deferred until the shared Phase 2 Markdown content directories and schemas
exist, so this tool does not invent a competing essay format.

For terminal-only use:

    npm run photos:review -- --batch summer-2026 --no-open

## 5. Check and promote selected drafts

Inspect what would be promoted:

    npm run photos:promote -- --batch summer-2026 --dry-run

Promote all selected records:

    npm run photos:promote -- --batch summer-2026

Or promote one reviewed stable ID:

    npm run photos:promote -- --batch summer-2026 --id supplied-stable-id

Promotion creates:

    src/content/photography/
    ├── masters/supplied-stable-id.jpg
    └── records/supplied-stable-id.json

The master is orientation-normalized, sRGB, metadata-inspected, and bounded to a
provisional 3200-pixel maximum edge without cropping. The public record contains no
source name, source path, hash, camera value, or private batch label. GPS metadata is never
embedded in the image. The public record contains latitude and longitude only when the review
checkbox explicitly enables them for that photograph. It is always created with **status:
draft**. The current site does not load these draft records, so promotion alone cannot publish a
photograph.

Selected records need a reviewed capture date and time before draft promotion. Other incomplete
editorial fields may remain explicit during local draft integration. Publication validation must
later reject a meaningful image without reviewed alt text or an unreviewed caption.

Approved date, time, location, and coordinates are displayed through an accessible image
information disclosure in the gallery. It opens by click or keyboard and works on touch devices;
the exact coordinates are still public data even when the disclosure is closed.

Promotion refuses to replace an existing managed master or record unless the newly
generated result is identical. After reviewing a correction, opt in to replacement:

    npm run photos:promote -- --batch summer-2026 --id supplied-stable-id --overwrite

The 3200-pixel bound and JPEG quality are implementation candidates, not approved
lasting publication settings.

## 6. Preview, correction, and recovery

- Reopen the review command at any time; saves are continuous and atomic.
- Correct metadata in the review workspace, run promotion with **--dry-run**, then use
  **--overwrite** only after reviewing the change.
- If import is interrupted, rerun the same import command. Hash verification restores
  incomplete copies without changing the source.
- If a private batch is no longer active, preserve a recoverable local archive with:

      mkdir -p .local/photography/_archived
      mv .local/photography/summer-2026 .local/photography/_archived/

- Restore it by moving the batch directory back, or re-import from the backed-up export
  folder.
- Removing a promoted draft requires removing both its managed master and JSON record
  in one reviewed Git change. Never remove or overwrite the backed-up phone export as
  part of repository cleanup.

## 7. Privacy guard

Run the guard directly:

    npm run photos:guard

It is also run before and after every production build. It rejects unignored or tracked
HEIC/HEIF/RAW files, private staging paths, private manifests, private provenance
markers, and symlinks from public output into the intake area.

The guard complements, rather than replaces, the metadata inspection performed when a
draft master is generated. Responsive-variant generation and independent variant
metadata inspection remain Phase 2 work once the shared public photography content
model is wired into the site.

## References

- [Apple ImageIO](https://developer.apple.com/documentation/imageio)
- [Apple orientation-aware thumbnail transform](https://developer.apple.com/documentation/imageio/kcgimagesourcecreatethumbnailwithtransform)
- [sharp output and metadata behavior](https://sharp.pixelplumbing.com/api-output/)
- [sharp auto orientation](https://sharp.pixelplumbing.com/api-operation/#autoorient)
- [sharp aspect-preserving resize](https://sharp.pixelplumbing.com/api-resize/)
- [heic-decode source and usage](https://github.com/catdad-experiments/heic-decode)
