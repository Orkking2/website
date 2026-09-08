import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { processImages, readImageMetadata } from './lib/apple-image-tool.mjs';
import {
	PRIVATE_PHOTO_ROOT,
	PROJECT_ROOT,
	classifyFile,
	ensurePrivateDirectory,
	hashFile,
	parseExifCapture,
	pathExists,
	readJson,
	writeJsonAtomic
} from './lib/core.mjs';
import { applyWatermark, watermarkSettings, watermarkText } from './watermark.ts';

/**
 * .local/photography is the library: the photographs this site hosts, kept as the
 * files you put there and never copied. Placing an image in it is the selection.
 *
 * .local/photography/.data is a reserved cache keyed by content hash. A rescan
 * costs one stat per unchanged file, so the library can grow large without every
 * later run paying to read it again.
 */
export const MASTER_MAX_PIXELS = 3200;
export const MASTER_QUALITY = 0.92;
export const PREVIEW_MAX_PIXELS = 1400;
export const PREVIEW_QUALITY = 84;
export const INDEX_VERSION = 2;

export function libraryPaths(root = PRIVATE_PHOTO_ROOT, project = PROJECT_ROOT) {
	const data = path.join(root, '.data');
	return {
		root,
		data,
		index: path.join(data, 'index.json'),
		images: path.join(data, 'images'),
		masters: path.join(project, 'src/content/photography/.photogrid/masters'),
		records: path.join(project, 'src/content/photography/.photogrid/records')
	};
}

const cacheFile = (paths, id, suffix) => path.join(paths.images, `${id}.${suffix}`);

/** Walk the library, skipping the reserved cache and anything else dot-prefixed. */
async function collectLibraryFiles(root) {
	const files = [];
	const skipped = [];
	async function visit(directory) {
		let entries;
		try {
			entries = await readdir(directory, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
			if (entry.name.startsWith('.')) continue;
			const absolute = path.join(directory, entry.name);
			const relative = path.relative(root, absolute);
			if (entry.isSymbolicLink()) {
				skipped.push({ relative, reason: 'A symbolic link is never followed.' });
				continue;
			}
			if (entry.isDirectory()) {
				await visit(absolute);
				continue;
			}
			if (!entry.isFile()) continue;
			if (classifyFile(absolute).kind !== 'image') {
				skipped.push({ relative, reason: 'Not a supported photograph.' });
				continue;
			}
			files.push({ absolute, relative });
		}
	}
	await visit(root);
	return { files, skipped };
}

async function readIndex(paths) {
	const index = await readJson(paths.index).catch(() => null);
	if (!index || index.version !== INDEX_VERSION) return { version: INDEX_VERSION, entries: {} };
	return index;
}

/**
 * Derive everything expensive for one photograph exactly once: the sanitized
 * publication master and a clean preview, both from a single decode.
 */
async function deriveImage(paths, file, id) {
	await mkdir(paths.masters, { recursive: true });
	await ensurePrivateDirectory(paths.images);
	const master = path.join(paths.masters, `${id}.jpg`);
	const [result] = await processImages([
		{
			key: id,
			source: file.absolute,
			output: master,
			maxPixelSize: MASTER_MAX_PIXELS,
			quality: MASTER_QUALITY
		}
	]);
	if (!result.ok) throw new Error(`${file.relative}: ${result.error}`);
	// The preview comes off the finished master, so a HEIC is decoded once per photograph.
	await sharp(master)
		.resize({ width: PREVIEW_MAX_PIXELS, withoutEnlargement: true })
		.jpeg({ quality: PREVIEW_QUALITY })
		.toFile(cacheFile(paths, id, 'preview.jpg'));
	const capture = parseExifCapture(result.capture);
	const gps = result.gpsCoordinates;
	return {
		id,
		width: result.outputWidth,
		height: result.outputHeight,
		capture: { local: capture.localValue, offset: capture.offset, source: capture.source },
		coordinates:
			Number.isFinite(gps?.latitude) && Number.isFinite(gps?.longitude)
				? { latitude: gps.latitude, longitude: gps.longitude }
				: null,
		derivedAt: new Date().toISOString()
	};
}

/**
 * The watermarked preview the studio shows, regenerated only when the marked text
 * actually changes: editing a caption costs nothing, editing a date costs one
 * composite rather than another decode.
 */
export async function watermarkedPreview(id, subject, paths = libraryPaths()) {
	const text = watermarkText(subject);
	const stampValue = `${watermarkSettings.version}\n${text}\n${subject.title ?? ''}`;
	const marked = cacheFile(paths, id, 'marked.jpg');
	const stamp = cacheFile(paths, id, 'marked.txt');
	const current = await readFile(stamp, 'utf8').catch(() => null);
	if (current === stampValue && (await pathExists(marked))) return marked;
	const preview = cacheFile(paths, id, 'preview.jpg');
	if (!(await pathExists(preview))) return null;
	const pixels = await (
		await applyWatermark(sharp(preview), subject)
	)
		.jpeg({ quality: PREVIEW_QUALITY })
		.toBuffer();
	await writeFile(`${marked}.tmp`, pixels, { mode: 0o600 });
	await rename(`${marked}.tmp`, marked);
	await writeFile(stamp, stampValue, { mode: 0o600 });
	return marked;
}

/** A public record seeded from what the file itself says. Everything here stays editable. */
export function seedRecord(derived) {
	return {
		schemaVersion: 1,
		id: derived.id,
		asset: {
			master: `../masters/${derived.id}.jpg`,
			format: 'jpeg',
			width: derived.width,
			height: derived.height,
			colorSpace: 'sRGB',
			orientation: 1
		},
		title: null,
		caption: null,
		alt: null,
		decorative: false,
		captured: {
			local: derived.capture.local || new Date().toISOString().slice(0, 19),
			offset: derived.capture.offset || null,
			precision: 'second'
		},
		reviewed: false,
		location: null,
		...(derived.coordinates ? { coordinates: derived.coordinates } : {}),
		gallery: { included: true }
	};
}

/**
 * Ask the original again for what it says about itself, and update the cache.
 *
 * Used when a cache entry predates a field this studio now keeps, so a rescan can
 * recover it without re-deriving the master.
 */
export async function refreshDerived(item, paths = libraryPaths()) {
	const source = path.join(paths.root, item.source);
	if (!(await pathExists(source))) throw new Error('The original is no longer in the library.');
	const [metadata] = await readImageMetadata([source]);
	if (!metadata?.ok) throw new Error(metadata?.error || 'The original could not be read.');
	const capture = parseExifCapture(metadata.capture);
	const gps = metadata.gpsCoordinates;
	const derived = {
		...item,
		capture: { local: capture.localValue, offset: capture.offset, source: capture.source },
		coordinates:
			Number.isFinite(gps?.latitude) && Number.isFinite(gps?.longitude)
				? { latitude: gps.latitude, longitude: gps.longitude }
				: null,
		refreshedAt: new Date().toISOString()
	};
	// The cache holds only what was derived from the pixels; where the file sits is the index's job.
	const cacheable = { ...derived };
	delete cacheable.source;
	delete cacheable.hash;
	await writeJsonAtomic(cacheFile(paths, item.id, 'json'), cacheable);
	return derived;
}

/**
 * Fill in fields a record was created without.
 *
 * Records written by an earlier pipeline can be missing data the original has
 * carried all along — coordinates, most of all, which used to be stripped. This
 * reads the cache first and the original only if the cache is silent too, and
 * never overwrites anything already written: a blank field is missing data, and
 * a field you cleared on purpose is one you can clear again.
 */
export async function backfillRecord(record, item, paths = libraryPaths()) {
	const filled = [];
	// Fields the original was asked for and genuinely does not carry, so the studio can say
	// "there is nothing to recover" rather than leaving a blank that looks like a failure.
	const absent = [];
	const next = structuredClone(record);
	const wantsCoordinates = !next.coordinates;
	const wantsOffset = !next.captured.offset;
	if (!wantsCoordinates && !wantsOffset) return { record: next, filled, absent };

	let derived = item;
	const silent =
		(wantsCoordinates && !derived.coordinates) || (wantsOffset && !derived.capture?.offset);
	// Ask the original again only once. A photograph taken with location services off has no
	// coordinates to recover now or later, and re-reading it every run costs a decode each time.
	if (silent && !derived.refreshedAt) derived = await refreshDerived(item, paths);

	if (wantsCoordinates) {
		if (derived.coordinates) {
			next.coordinates = derived.coordinates;
			filled.push('coordinates');
		} else absent.push('coordinates');
	}
	if (wantsOffset) {
		if (derived.capture?.offset) {
			next.captured.offset = derived.capture.offset;
			filled.push('UTC offset');
		} else absent.push('UTC offset');
	}
	return { record: next, filled, absent };
}

/** What a scan would have to derive, without deriving any of it. */
export async function planScan(paths = libraryPaths()) {
	const { files, skipped } = await collectLibraryFiles(paths.root);
	const index = await readIndex(paths);
	const known = new Set();
	for (const entry of Object.values(index.entries || {})) known.add(entry.hash);
	let fresh = 0;
	for (const file of files) {
		const cached = index.entries[file.relative];
		const stats = await stat(file.absolute).catch(() => null);
		if (!cached || !stats || cached.size !== stats.size || cached.mtimeMs !== stats.mtimeMs)
			fresh += 1;
	}
	return { total: files.length, fresh, skipped, knownHashes: known.size };
}

/**
 * Bring the library, the cache, the masters, and the records into agreement.
 * Only files whose size or modification time changed are re-read, and only
 * photographs with no derived data are decoded.
 */
export async function scanLibrary({ onProgress, paths = libraryPaths() } = {}) {
	await ensurePrivateDirectory(paths.root);
	await ensurePrivateDirectory(paths.data);
	await ensurePrivateDirectory(paths.images);
	const { files, skipped } = await collectLibraryFiles(paths.root);
	const index = await readIndex(paths);
	const entries = {};
	const items = [];
	let derivedCount = 0;

	for (const file of files) {
		const stats = await stat(file.absolute);
		const cached = index.entries[file.relative];
		const unchanged =
			cached && cached.size === stats.size && cached.mtimeMs === stats.mtimeMs && cached.hash;
		const hash = unchanged ? cached.hash : await hashFile(file.absolute);
		const id = `photo-${hash.slice(0, 12)}`;
		if (entries[file.relative]) continue;
		const derivedFile = cacheFile(paths, id, 'json');
		let derived = await readJson(derivedFile).catch(() => null);
		const complete =
			derived &&
			(await pathExists(path.join(paths.masters, `${id}.jpg`))) &&
			(await pathExists(cacheFile(paths, id, 'preview.jpg')));
		if (!complete) {
			onProgress?.({ relative: file.relative, id });
			derived = await deriveImage(paths, file, id);
			await writeJsonAtomic(derivedFile, derived);
			derivedCount += 1;
		}
		entries[file.relative] = { hash, size: stats.size, mtimeMs: stats.mtimeMs };
		items.push({ ...derived, id, source: file.relative, hash });
	}

	await writeJsonAtomic(paths.index, { version: INDEX_VERSION, entries });

	// A record exists for every photograph in the library, seeded once and edited thereafter.
	await mkdir(paths.records, { recursive: true });
	for (const item of items) {
		const record = path.join(paths.records, `${item.id}.json`);
		if (!(await pathExists(record))) await writeJsonAtomic(record, seedRecord(item), 0o644);
	}

	return { items, skipped, derivedCount };
}

/** Cached data for photographs whose source file has left the library. */
export async function pruneCache(keepIds, paths = libraryPaths()) {
	const keep = new Set(keepIds);
	const removed = [];
	for (const name of await readdir(paths.images).catch(() => [])) {
		const id = name.replace(/\.(json|preview\.jpg|marked\.jpg|marked\.txt)$/, '');
		if (id !== name && !keep.has(id)) {
			await rm(path.join(paths.images, name), { force: true });
			removed.push(name);
		}
	}
	return removed;
}
