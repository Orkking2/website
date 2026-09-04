import { randomBytes } from 'node:crypto';
import { chmod, copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { processImages } from './lib/apple-image-tool.mjs';
import {
	PROJECT_ROOT,
	hashFile,
	nowIso,
	pathExists,
	readManifest,
	resolveInside,
	reviewIssues,
	validateBatchName,
	validateStableId,
	writeJsonAtomic
} from './lib/core.mjs';

const PUBLIC_SOURCE_ROOT = path.join(PROJECT_ROOT, 'src', 'content', 'photography');
const MASTER_DIRECTORY = path.join(PUBLIC_SOURCE_ROOT, 'masters');
const RECORD_DIRECTORY = path.join(PUBLIC_SOURCE_ROOT, 'records');
const DEFAULT_MAX_PIXEL_SIZE = 3200;
const MASTER_QUALITY = 0.92;

function usage() {
	console.log(
		[
			'Usage: npm run photos:promote -- --batch <name> [--id <stable-id>] [--dry-run] [--overwrite]',
			'',
			'Promotes selected review records as drafts. It writes bounded, orientation-normalized sRGB',
			'JPEG masters outside static/ and public records that contain no source names, hashes, GPS,',
			'or device metadata. Promotion never changes a record from draft to published.'
		].join('\n')
	);
}

function parseArguments(arguments_) {
	const options = {
		batch: null,
		id: null,
		dryRun: false,
		overwrite: false,
		maxPixelSize: DEFAULT_MAX_PIXEL_SIZE
	};
	for (let index = 0; index < arguments_.length; index += 1) {
		const argument = arguments_[index];
		if (argument === '--help' || argument === '-h') {
			usage();
			process.exit(0);
		}
		if (argument === '--batch') {
			options.batch = arguments_[++index];
			if (!options.batch) throw new Error('--batch requires a value.');
			continue;
		}
		if (argument === '--id') {
			options.id = validateStableId(arguments_[++index]);
			continue;
		}
		if (argument === '--max-pixel-size') {
			options.maxPixelSize = Number(arguments_[++index]);
			if (
				!Number.isInteger(options.maxPixelSize) ||
				options.maxPixelSize < 1024 ||
				options.maxPixelSize > 6000
			) {
				throw new Error('--max-pixel-size must be an integer from 1024 through 6000.');
			}
			continue;
		}
		if (argument === '--dry-run') {
			options.dryRun = true;
			continue;
		}
		if (argument === '--overwrite') {
			options.overwrite = true;
			continue;
		}
		throw new Error('Unknown option: ' + argument);
	}
	if (!options.batch) throw new Error('--batch <name> is required.');
	options.batch = validateBatchName(options.batch);
	return options;
}

function publicRecord(item, imageResult) {
	const review = item.review;
	return {
		schemaVersion: 1,
		id: review.stableId,
		status: 'draft',
		asset: {
			master: '../masters/' + review.stableId + '.jpg',
			format: 'jpeg',
			width: imageResult.outputWidth,
			height: imageResult.outputHeight,
			colorSpace: 'sRGB',
			orientation: 1
		},
		title: review.title || null,
		caption: review.captionReviewed ? review.caption : null,
		alt: review.decorative ? '' : review.altText || null,
		decorative: Boolean(review.decorative),
		captured: {
			local: review.capturedAt,
			offset: review.capturedOffset || null,
			precision: review.capturedAt.length === 16 ? 'minute' : 'second'
		},
		location: review.publicLocation || null,
		gallery: {
			included: Boolean(review.galleryIncluded)
		},
		photoEssay: review.photoEssaySlug || null,
		editorial: {
			captionReviewed: Boolean(review.captionReviewed),
			captureReviewed: Boolean(review.captureReviewed)
		}
	};
}

function validatePublicRecord(record, maxPixelSize) {
	validateStableId(record.id);
	if (record.status !== 'draft') throw new Error(record.id + ': promotion must create a draft.');
	if (!record.asset?.master.endsWith('/' + record.id + '.jpg')) {
		throw new Error(record.id + ': managed asset path is not stable.');
	}
	if (
		!Number.isInteger(record.asset.width) ||
		!Number.isInteger(record.asset.height) ||
		Math.max(record.asset.width, record.asset.height) > maxPixelSize
	) {
		throw new Error(record.id + ': publication master dimensions are missing or unbounded.');
	}
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(record.captured?.local || '')) {
		throw new Error(record.id + ': every selected photograph requires its capture date and time.');
	}
	const serialized = JSON.stringify(record);
	if (
		/\.local[/\\]photography|[/\\]Users[/\\]|sourceFilename|sourceRelative|sha256/i.test(serialized)
	) {
		throw new Error(record.id + ': public record contains private intake provenance.');
	}
}

async function writePublicFileAtomic(destination, source) {
	await mkdir(path.dirname(destination), { recursive: true, mode: 0o755 });
	const temporary = destination + '.' + process.pid + '.' + randomBytes(6).toString('hex') + '.tmp';
	try {
		await copyFile(source, temporary);
		await chmod(temporary, 0o644);
		await rename(temporary, destination);
	} finally {
		await rm(temporary, { force: true });
	}
}

async function writePublicJsonAtomic(destination, value) {
	await mkdir(path.dirname(destination), { recursive: true, mode: 0o755 });
	const temporary = destination + '.' + process.pid + '.' + randomBytes(6).toString('hex') + '.tmp';
	try {
		await writeFile(temporary, JSON.stringify(value, null, '\t') + '\n', { mode: 0o644 });
		await rename(temporary, destination);
	} finally {
		await rm(temporary, { force: true });
	}
}

async function sameJson(destination, value) {
	if (!(await pathExists(destination))) return false;
	try {
		return (
			JSON.stringify(JSON.parse(await readFile(destination, 'utf8'))) === JSON.stringify(value)
		);
	} catch {
		return false;
	}
}

async function run() {
	const options = parseArguments(process.argv.slice(2));
	const { manifest, paths } = await readManifest(options.batch);
	const selected = manifest.items.filter(
		(item) =>
			item.kind === 'image' &&
			item.review?.status === 'selected' &&
			(!options.id || item.review.stableId === options.id)
	);
	if (selected.length === 0) {
		throw new Error(
			options.id
				? 'No selected photograph has stable ID ' + options.id + '.'
				: 'This batch has no selected photographs. Review the batch before promotion.'
		);
	}

	const ids = new Set();
	for (const item of selected) {
		validateStableId(item.review.stableId);
		if (ids.has(item.review.stableId)) {
			throw new Error('Duplicate stable photo ID in selection: ' + item.review.stableId);
		}
		ids.add(item.review.stableId);
	}

	console.log('Selected draft candidates: ' + selected.length);
	for (const item of selected) {
		const issues = reviewIssues(item);
		console.log(
			'  ' +
				item.review.stableId +
				(issues.length > 0 ? ' — ' + issues.length + ' incomplete review item(s)' : ' — complete')
		);
	}
	if (options.dryRun) {
		console.log('Dry run only. No publication masters or public records were written.');
		return;
	}

	const missingRequiredCapture = selected.filter(
		(item) => !item.review?.capturedAt || !item.review?.captureReviewed
	);
	if (missingRequiredCapture.length > 0) {
		throw new Error(
			missingRequiredCapture.length +
				' selected photograph(s) need a reviewed capture date and time before promotion.'
		);
	}

	const promotionDirectory = path.join(paths.root, 'promotion-staging');
	await mkdir(promotionDirectory, { recursive: true, mode: 0o700 });
	const requests = selected.map((item) => ({
		key: item.importId,
		source: resolveInside(paths.root, item.original.path),
		output: path.join(promotionDirectory, item.review.stableId + '.jpg'),
		maxPixelSize: options.maxPixelSize,
		quality: MASTER_QUALITY
	}));
	const results = await processImages(requests);
	const resultById = new Map(results.map((result) => [result.key, result]));
	const candidates = [];

	for (const item of selected) {
		const result = resultById.get(item.importId);
		if (!result?.ok) {
			throw new Error(
				item.review.stableId +
					': publication-master conversion failed: ' +
					(result?.error || 'unknown')
			);
		}
		if (
			result.outputGpsPresent ||
			result.outputDeviceMetadataPresent ||
			result.outputSensitiveMetadata?.length > 0
		) {
			throw new Error(item.review.stableId + ': sanitized master retained private metadata.');
		}
		if (!/srgb/i.test(result.outputProfileName || '')) {
			throw new Error(item.review.stableId + ': sanitized master is not tagged as sRGB.');
		}
		if (Math.max(result.outputWidth, result.outputHeight) > options.maxPixelSize) {
			throw new Error(item.review.stableId + ': sanitized master exceeds the configured bound.');
		}

		const record = publicRecord(item, result);
		validatePublicRecord(record, options.maxPixelSize);
		const stagedMaster = requests.find((request) => request.key === item.importId).output;
		const stagedBytes = await readFile(stagedMaster);
		const forbiddenMarkers = [
			'.local/photography',
			'.local\\photography',
			'/Users/',
			...item.original.sourceFilenames
		];
		for (const marker of forbiddenMarkers) {
			if (stagedBytes.includes(Buffer.from(marker))) {
				throw new Error(item.review.stableId + ': sanitized master contains private provenance.');
			}
		}
		const masterDestination = path.join(MASTER_DIRECTORY, item.review.stableId + '.jpg');
		const recordDestination = path.join(RECORD_DIRECTORY, item.review.stableId + '.json');
		const masterExists = await pathExists(masterDestination);
		const recordMatches = await sameJson(recordDestination, record);
		let masterMatches = false;
		if (masterExists) {
			masterMatches = (await hashFile(masterDestination)) === (await hashFile(stagedMaster));
		}
		if ((masterExists || (await pathExists(recordDestination))) && !options.overwrite) {
			if (!(masterMatches && recordMatches)) {
				throw new Error(
					item.review.stableId +
						': a managed master or record already exists; use --overwrite after reviewing the change.'
				);
			}
		}
		candidates.push({
			item,
			result,
			record,
			stagedMaster,
			masterDestination,
			recordDestination,
			unchanged: masterMatches && recordMatches
		});
	}

	for (const candidate of candidates) {
		if (!candidate.unchanged) {
			await writePublicFileAtomic(candidate.masterDestination, candidate.stagedMaster);
			await writePublicJsonAtomic(candidate.recordDestination, candidate.record);
		}
		candidate.item.promotion = {
			status: 'draft',
			promotedAt: nowIso(),
			master: path.relative(PROJECT_ROOT, candidate.masterDestination).split(path.sep).join('/'),
			record: path.relative(PROJECT_ROOT, candidate.recordDestination).split(path.sep).join('/')
		};
	}
	manifest.updatedAt = nowIso();
	await writeJsonAtomic(paths.manifest, manifest);

	console.log(
		'Promoted ' +
			candidates.length +
			' selected photograph(s) as drafts under src/content/photography/.'
	);
	console.log('No photograph was made production-visible.');
}

run().catch((error) => {
	console.error('Photo promotion failed: ' + error.message);
	process.exitCode = 1;
});
