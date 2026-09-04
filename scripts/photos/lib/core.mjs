import { createHash, randomBytes } from 'node:crypto';
import {
	access,
	chmod,
	copyFile,
	mkdir,
	open,
	readdir,
	readFile,
	realpath,
	rename,
	rm,
	stat,
	writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const PRIVATE_PHOTO_ROOT = path.join(PROJECT_ROOT, '.local', 'photography');
export const PRIVATE_MANIFEST_NAME = 'manifest.private.json';
export const MANIFEST_SCHEMA_VERSION = 1;

export const SUPPORTED_IMAGE_EXTENSIONS = new Map([
	['.heic', 'heic'],
	['.heif', 'heic'],
	['.jpg', 'jpeg'],
	['.jpeg', 'jpeg'],
	['.png', 'png']
]);

export const RAW_EXTENSIONS = new Set([
	'.3fr',
	'.arw',
	'.cr2',
	'.cr3',
	'.dng',
	'.erf',
	'.fff',
	'.iiq',
	'.kdc',
	'.mef',
	'.mos',
	'.mrw',
	'.nef',
	'.nrw',
	'.orf',
	'.pef',
	'.raf',
	'.raw',
	'.rw2',
	'.rwl',
	'.sr2',
	'.srf',
	'.srw',
	'.x3f'
]);

export const VIDEO_EXTENSIONS = new Set(['.mov', '.mp4', '.m4v']);
export const SIDECAR_EXTENSIONS = new Set(['.aae', '.xmp']);

export function nowIso() {
	return new Date().toISOString();
}

export function validateBatchName(value) {
	if (typeof value !== 'string' || !/^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/.test(value)) {
		throw new Error(
			'Batch names must be 1–64 lowercase letters, numbers, hyphens, or underscores, and must begin and end with a letter or number.'
		);
	}

	return value;
}

export function validateStableId(value) {
	if (typeof value !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(value)) {
		throw new Error(
			'Stable photo IDs must be 1–64 lowercase letters, numbers, or hyphens, and must begin and end with a letter or number.'
		);
	}

	return value;
}

export function batchPaths(batch) {
	const safeBatch = validateBatchName(batch);
	const root = path.join(PRIVATE_PHOTO_ROOT, safeBatch);

	return {
		root,
		originals: path.join(root, 'originals'),
		thumbnails: path.join(root, 'thumbnails'),
		manifest: path.join(root, PRIVATE_MANIFEST_NAME)
	};
}

export async function ensurePrivateDirectory(directory) {
	await mkdir(directory, { recursive: true, mode: 0o700 });
	await chmod(directory, 0o700);
}

export async function pathExists(candidate) {
	try {
		await access(candidate);
		return true;
	} catch {
		return false;
	}
}

export function resolveInside(root, relativePath) {
	const resolvedRoot = path.resolve(root);
	const resolved = path.resolve(resolvedRoot, relativePath);
	const relation = path.relative(resolvedRoot, resolved);

	if (relation.startsWith('..') || path.isAbsolute(relation)) {
		throw new Error(`Path escapes its private batch directory: ${relativePath}`);
	}

	return resolved;
}

export async function readJson(candidate) {
	return JSON.parse(await readFile(candidate, 'utf8'));
}

export async function readManifest(batch) {
	const paths = batchPaths(batch);

	if (!(await pathExists(paths.manifest))) {
		throw new Error(
			`Photography batch "${batch}" does not exist. Import it first with npm run photos:import.`
		);
	}

	const manifest = await readJson(paths.manifest);
	if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION || manifest.batch !== batch) {
		throw new Error(`Photography batch "${batch}" has an unsupported or invalid private manifest.`);
	}

	return { manifest, paths };
}

export async function writeJsonAtomic(candidate, value, mode = 0o600) {
	await ensurePrivateDirectory(path.dirname(candidate));
	const temporary = `${candidate}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;

	try {
		await writeFile(temporary, `${JSON.stringify(value, null, '\t')}\n`, { mode });
		await chmod(temporary, mode);
		await rename(temporary, candidate);
	} finally {
		await rm(temporary, { force: true });
	}
}

export async function hashFile(candidate) {
	const handle = await open(candidate, 'r');
	const hash = createHash('sha256');

	try {
		for await (const chunk of handle.createReadStream({ autoClose: false })) hash.update(chunk);
	} finally {
		await handle.close();
	}

	return hash.digest('hex');
}

export function classifyFile(candidate) {
	const extension = path.extname(candidate).toLowerCase();
	const supportedFormat = SUPPORTED_IMAGE_EXTENSIONS.get(extension);

	if (supportedFormat) return { kind: 'image', extension, supportedFormat };
	if (RAW_EXTENSIONS.has(extension)) return { kind: 'raw', extension };
	if (VIDEO_EXTENSIONS.has(extension)) return { kind: 'video', extension };
	if (SIDECAR_EXTENSIONS.has(extension)) return { kind: 'sidecar', extension };
	return { kind: 'unsupported', extension };
}

export async function collectInputFiles(sourceRoot) {
	const resolvedRoot = await realpath(path.resolve(sourceRoot));
	const sourceStats = await stat(resolvedRoot);
	if (!sourceStats.isDirectory())
		throw new Error(`Photo import source is not a directory: ${sourceRoot}`);

	const files = [];
	const warnings = [];

	async function visit(directory) {
		const entries = await readdir(directory, { withFileTypes: true });
		entries.sort((left, right) => left.name.localeCompare(right.name));

		for (const entry of entries) {
			if (entry.name === '.DS_Store' || entry.name === 'Thumbs.db') continue;
			const absolutePath = path.join(directory, entry.name);
			const relativePath = path.relative(resolvedRoot, absolutePath);

			if (entry.isSymbolicLink()) {
				warnings.push({
					code: 'symlink-skipped',
					path: relativePath,
					message:
						'Skipped a symbolic link; imports never follow links outside the supplied folder.'
				});
				continue;
			}

			if (entry.isDirectory()) {
				await visit(absolutePath);
				continue;
			}

			if (!entry.isFile()) {
				warnings.push({
					code: 'non-file-skipped',
					path: relativePath,
					message: 'Skipped an item that is not a regular file.'
				});
				continue;
			}

			const fileStats = await stat(absolutePath);
			files.push({
				absolutePath,
				relativePath,
				basename: entry.name,
				bytes: fileStats.size,
				...classifyFile(entry.name)
			});
		}
	}

	await visit(resolvedRoot);
	return { root: resolvedRoot, files, warnings };
}

export async function copyFileVerified(source, destination, expectedHash) {
	if (await pathExists(destination)) {
		const existingHash = await hashFile(destination);
		if (existingHash !== expectedHash) {
			throw new Error(`Private intake destination exists with unexpected content: ${destination}`);
		}
		return false;
	}

	await ensurePrivateDirectory(path.dirname(destination));
	const temporary = `${destination}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;

	try {
		await copyFile(source, temporary);
		await chmod(temporary, 0o600);
		const copiedHash = await hashFile(temporary);
		if (copiedHash !== expectedHash) {
			throw new Error(`Source changed while it was being copied: ${source}`);
		}
		await rename(temporary, destination);
		return true;
	} finally {
		await rm(temporary, { force: true });
	}
}

export function parseExifCapture(capture = {}) {
	const raw = capture.dateTimeOriginal || capture.dateTimeDigitized || capture.tiffDateTime || null;
	const source = capture.dateTimeOriginal
		? 'exif-original'
		: capture.dateTimeDigitized
			? 'exif-digitized'
			: capture.tiffDateTime
				? 'tiff'
				: null;

	if (!raw || typeof raw !== 'string') {
		return {
			raw: null,
			localValue: null,
			offset: null,
			source: null,
			timezoneStatus: 'missing-capture-time'
		};
	}

	const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(raw.trim());
	const localValue = match
		? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`
		: null;
	const offset =
		capture.offsetTimeOriginal || capture.offsetTimeDigitized || capture.offsetTime || null;

	return {
		raw,
		localValue,
		offset,
		source,
		timezoneStatus: offset ? 'explicit-offset' : 'missing-offset'
	};
}

export function defaultReview(hash, captureSuggestion) {
	return {
		status: 'pending',
		stableId: `photo-${hash.slice(0, 12)}`,
		title: '',
		caption: '',
		captionReviewed: false,
		altText: '',
		decorative: false,
		capturedAt: captureSuggestion.localValue || '',
		capturedOffset: captureSuggestion.offset || '',
		captureReviewed: false,
		publicLocation: '',
		galleryIncluded: false,
		photoEssaySlug: '',
		updatedAt: null
	};
}

export function mergeReviewDefaults(review, hash, captureSuggestion) {
	const defaults = defaultReview(hash, captureSuggestion);
	const merged = { ...defaults, ...(review || {}) };

	delete merged.coordinateLatitude;
	delete merged.coordinateLongitude;
	delete merged.includeCoordinates;
	delete merged.galleryOrder;
	return merged;
}

function isValidLocalDateTime(value) {
	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
	if (!match) return false;
	const parts = match.slice(1).map((part) => Number(part || 0));
	const [year, month, day, hour, minute, second] = parts;
	const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
	return (
		parsed.getUTCFullYear() === year &&
		parsed.getUTCMonth() === month - 1 &&
		parsed.getUTCDate() === day &&
		parsed.getUTCHours() === hour &&
		parsed.getUTCMinutes() === minute &&
		parsed.getUTCSeconds() === second
	);
}

export function reviewIssues(item) {
	if (item.kind !== 'image') return [];

	const review = item.review || {};
	const issues = [];
	if (review.status === 'pending') issues.push('Choose select, hold, or reject.');
	if (review.status !== 'selected') return issues;

	try {
		validateStableId(review.stableId);
	} catch (error) {
		issues.push(error.message);
	}
	if (!review.captionReviewed) issues.push('Review the caption, including an intentional blank.');
	if (!review.decorative && !review.altText?.trim()) {
		issues.push('Add reviewed alt text or explicitly mark the image decorative.');
	}
	if (!review.capturedAt) {
		issues.push('Add the required capture date and time.');
	} else if (!review.captureReviewed) {
		issues.push('Review the required capture date and time.');
	}
	return issues;
}

export function normalizeReviewPatch(current, patch) {
	const next = { ...current };
	const stringFields = [
		'stableId',
		'title',
		'caption',
		'altText',
		'capturedAt',
		'capturedOffset',
		'publicLocation',
		'photoEssaySlug'
	];
	const booleanFields = ['captionReviewed', 'decorative', 'captureReviewed', 'galleryIncluded'];

	if ('status' in patch) {
		if (!['pending', 'selected', 'hold', 'rejected'].includes(patch.status)) {
			throw new Error('Review status must be pending, selected, hold, or rejected.');
		}
		next.status = patch.status;
	}

	for (const field of stringFields) {
		if (field in patch) {
			if (typeof patch[field] !== 'string') throw new Error(`${field} must be a string.`);
			next[field] = patch[field].trim();
		}
	}

	for (const field of booleanFields) {
		if (field in patch) {
			if (typeof patch[field] !== 'boolean') throw new Error(`${field} must be true or false.`);
			next[field] = patch[field];
		}
	}

	if (next.stableId) validateStableId(next.stableId);
	if (next.capturedOffset && !/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(next.capturedOffset)) {
		throw new Error('capturedOffset must use ±HH:MM.');
	}
	if (next.capturedAt && !isValidLocalDateTime(next.capturedAt)) {
		throw new Error('capturedAt must be a local ISO date and time without an assumed timezone.');
	}
	if (next.photoEssaySlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(next.photoEssaySlug)) {
		throw new Error('photoEssaySlug must be a lowercase hyphenated slug.');
	}
	if (next.decorative) next.altText = '';
	next.updatedAt = nowIso();

	return next;
}
