import { createHash, randomBytes } from 'node:crypto';
import { access, chmod, mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const PRIVATE_PHOTO_ROOT = path.join(PROJECT_ROOT, '.local', 'photography');

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

export function validateStableId(value) {
	if (typeof value !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(value)) {
		throw new Error(
			'Stable photo IDs must be 1–64 lowercase letters, numbers, or hyphens, and must begin and end with a letter or number.'
		);
	}

	return value;
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
