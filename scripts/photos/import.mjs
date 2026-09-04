import { chmod, readdir } from 'node:fs/promises';
import path from 'node:path';
import { processImages } from './lib/apple-image-tool.mjs';
import {
	MANIFEST_SCHEMA_VERSION,
	PRIVATE_MANIFEST_NAME,
	PRIVATE_PHOTO_ROOT,
	batchPaths,
	collectInputFiles,
	copyFileVerified,
	ensurePrivateDirectory,
	hashFile,
	mergeReviewDefaults,
	nowIso,
	parseExifCapture,
	pathExists,
	readJson,
	resolveInside,
	validateBatchName,
	writeJsonAtomic
} from './lib/core.mjs';

const THUMBNAIL_SIZE = 1600;
const THUMBNAIL_QUALITY = 0.84;

function usage() {
	console.log(
		[
			'Usage: npm run photos:import -- <folder> --batch <name> [--refresh-metadata]',
			'',
			'Copies phone-export files into a private, Git-ignored batch; hashes and deduplicates them;',
			'and creates metadata records plus orientation-correct sRGB review thumbnails.',
			'The source folder is never edited, moved, or deleted.'
		].join('\n')
	);
}

function parseArguments(arguments_) {
	const options = { source: null, batch: null, refreshMetadata: false };

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
		if (argument === '--refresh-metadata') {
			options.refreshMetadata = true;
			continue;
		}
		if (argument.startsWith('-')) throw new Error('Unknown option: ' + argument);
		if (options.source) throw new Error('Provide exactly one source folder.');
		options.source = argument;
	}

	if (!options.source) throw new Error('A source folder is required.');
	if (!options.batch) throw new Error('--batch <name> is required.');
	options.batch = validateBatchName(options.batch);
	return options;
}

function normalizedExtension(file) {
	if (file.kind === 'image' && file.supportedFormat === 'heic') return '.heic';
	if (file.kind === 'image' && file.supportedFormat === 'jpeg') return '.jpg';
	if (file.kind === 'image' && file.supportedFormat === 'png') return '.png';
	return file.extension || '.bin';
}

function stableUnique(values) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function privateCoordinateTag(format, coordinates) {
	if (!Number.isFinite(coordinates?.latitude) || !Number.isFinite(coordinates?.longitude)) {
		return null;
	}
	return {
		source: format === 'heic' ? 'heic-original-gps' : 'original-image-gps',
		latitude: coordinates.latitude,
		longitude: coordinates.longitude
	};
}

function sameStem(left, right) {
	const leftStem = path.basename(left.relativePath, path.extname(left.relativePath)).toLowerCase();
	const rightStem = path
		.basename(right.relativePath, path.extname(right.relativePath))
		.toLowerCase();
	return (
		path.dirname(left.relativePath) === path.dirname(right.relativePath) && leftStem === rightStem
	);
}

function baseWarnings(group, allFiles, crossBatchDuplicates) {
	const first = group.files[0];
	const warnings = [];

	if (group.files.length > 1) {
		warnings.push({
			code: 'exact-duplicate-in-source',
			message:
				'This content appeared ' +
				group.files.length +
				' times in the supplied folder; one private copy and one review record were kept.'
		});
	}
	if (crossBatchDuplicates.length > 0) {
		warnings.push({
			code: 'duplicate-in-other-batch',
			message:
				'The same content hash already exists in private batch' +
				(crossBatchDuplicates.length === 1 ? ' ' : 'es ') +
				crossBatchDuplicates.map((entry) => entry.batch).join(', ') +
				'.'
		});
	}
	if (first.kind === 'raw') {
		warnings.push({
			code: 'unsupported-raw',
			message:
				'RAW input was preserved privately but cannot be reviewed or promoted by this toolchain.'
		});
	}
	if (first.kind === 'video') {
		const isCompanion = allFiles.some(
			(candidate) => candidate.kind === 'image' && sameStem(first, candidate)
		);
		warnings.push({
			code: isCompanion ? 'live-photo-video-companion' : 'unsupported-video',
			message: isCompanion
				? 'A matching Live Photo video companion was preserved privately and will not be published.'
				: 'Video input was preserved privately but is outside the photography review workflow.'
		});
	}
	if (first.kind === 'sidecar') {
		warnings.push({
			code: 'adjustment-sidecar',
			message:
				'An adjustment sidecar was preserved privately. Confirm the rendered photograph matches the intended edit.'
		});
	}
	if (first.kind === 'unsupported') {
		warnings.push({
			code: 'unsupported-file',
			message:
				'This unrecognized file was preserved privately and listed instead of being silently discarded.'
		});
	}

	return warnings;
}

function metadataWarnings(result, captureSuggestion, expectedFormat) {
	const warnings = [];
	const expectedIdentifiers = {
		heic: new Set(['public.heic', 'public.heif']),
		jpeg: new Set(['public.jpeg']),
		png: new Set(['public.png'])
	};

	if (!result.ok) {
		return [
			{ code: 'image-processing-failed', message: result.error || 'Image processing failed.' }
		];
	}
	if (!expectedIdentifiers[expectedFormat]?.has(result.formatIdentifier)) {
		warnings.push({
			code: 'format-extension-mismatch',
			message:
				'The decoded image type (' +
				(result.formatIdentifier || 'unknown') +
				') does not match its filename extension.'
		});
	}
	if (captureSuggestion.timezoneStatus === 'missing-capture-time') {
		warnings.push({
			code: 'capture-time-missing',
			message:
				'No capture timestamp was found. Add or confirm one during review if it should be public.'
		});
	} else if (captureSuggestion.timezoneStatus === 'missing-offset') {
		warnings.push({
			code: 'capture-timezone-missing',
			message:
				'The capture timestamp has no UTC offset. It remains a local-time suggestion until reviewed.'
		});
	}
	if (result.gpsPresent) {
		warnings.push({
			code: 'private-gps-present',
			message:
				'The original contains GPS metadata. Coordinates are retained only as a private tag; the thumbnail and public record contain none.'
		});
		if (!result.gpsCoordinates) {
			warnings.push({
				code: 'gps-coordinates-unreadable',
				message: 'GPS metadata is present, but a valid latitude/longitude pair was not found.'
			});
		}
	}
	if (result.deviceMetadataPresent) {
		warnings.push({
			code: 'private-device-metadata-present',
			message:
				'The original contains camera/device metadata. Values were not copied into the review record.'
		});
	}
	if (result.xmpPresent) {
		warnings.push({
			code: 'private-xmp-present',
			message: 'The original contains XMP metadata. It was not copied into the review thumbnail.'
		});
	}
	if (result.imageCount > 1) {
		warnings.push({
			code: 'multi-image-container',
			message:
				'The source contains ' +
				result.imageCount +
				' images; intake currently reviews the primary image only.'
		});
	}
	if (result.orientation !== 1) {
		warnings.push({
			code: 'orientation-normalized-for-review',
			message:
				'The original orientation tag (' +
				result.orientation +
				') was applied to the private review thumbnail.'
		});
	}
	if (result.profileName && !/srgb/i.test(result.profileName)) {
		warnings.push({
			code: 'review-thumbnail-color-converted',
			message:
				'The source profile (' +
				result.profileName +
				') was converted to sRGB for the private review thumbnail.'
		});
	}
	if (
		result.outputGpsPresent ||
		result.outputDeviceMetadataPresent ||
		result.outputSensitiveMetadata?.length > 0
	) {
		warnings.push({
			code: 'thumbnail-private-metadata-retained',
			message:
				'The generated thumbnail unexpectedly retained private metadata. Do not use it until the toolchain is fixed.'
		});
	}
	if (result.nearUniformOutput) {
		warnings.push({
			code: 'near-uniform-review-output',
			message:
				'The generated review image is nearly uniform. Confirm that the decoder rendered real pixels before review.'
		});
	}

	return warnings;
}

async function loadCrossBatchIndex(currentBatch) {
	const index = new Map();
	await ensurePrivateDirectory(PRIVATE_PHOTO_ROOT);
	const entries = await readdir(PRIVATE_PHOTO_ROOT, { withFileTypes: true });

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === currentBatch) continue;
		const manifestPath = path.join(PRIVATE_PHOTO_ROOT, entry.name, PRIVATE_MANIFEST_NAME);
		if (!(await pathExists(manifestPath))) continue;
		try {
			const manifest = await readJson(manifestPath);
			for (const item of manifest.items || []) {
				const hash = item.hash?.value;
				if (!hash) continue;
				const matches = index.get(hash) || [];
				matches.push({ batch: entry.name, importId: item.importId });
				index.set(hash, matches);
			}
		} catch {
			// A broken private batch must not prevent importing a separate batch.
		}
	}

	return index;
}

async function run() {
	const options = parseArguments(process.argv.slice(2));
	const paths = batchPaths(options.batch);
	const source = await collectInputFiles(options.source);
	if (source.files.length === 0) throw new Error('The source folder contains no regular files.');

	await ensurePrivateDirectory(paths.root);
	await ensurePrivateDirectory(paths.originals);
	await ensurePrivateDirectory(paths.thumbnails);

	const existingManifest = (await pathExists(paths.manifest))
		? await readJson(paths.manifest)
		: null;
	if (
		existingManifest &&
		(existingManifest.schemaVersion !== MANIFEST_SCHEMA_VERSION ||
			existingManifest.batch !== options.batch)
	) {
		throw new Error('The existing private manifest is invalid or uses an unsupported schema.');
	}
	const refreshesPrivateInbox = path.resolve(source.root) === path.resolve(paths.originals);
	if (refreshesPrivateInbox && !existingManifest) {
		throw new Error('A private-inbox refresh requires an existing valid batch manifest.');
	}

	console.log('Scanning and hashing ' + source.files.length + ' source files…');
	const groups = new Map();
	for (const file of source.files) {
		const hash = await hashFile(file.absolutePath);
		const existing = groups.get(hash);
		if (existing) existing.files.push(file);
		else groups.set(hash, { hash, files: [file] });
	}

	const crossBatchIndex = await loadCrossBatchIndex(options.batch);
	const existingByHash = new Map(
		(existingManifest?.items || []).map((item) => [item.hash?.value, item])
	);
	const nextItems = [];
	const imageRequests = [];
	const copied = [];
	const repeated = [];

	for (const group of groups.values()) {
		const first = group.files[0];
		const existing = existingByHash.get(group.hash);
		const importId = existing?.importId || 'photo-' + group.hash.slice(0, 16);
		const extension = normalizedExtension(first);
		const relativeOriginal = existing?.original?.path || 'originals/' + group.hash + extension;
		const absoluteOriginal = resolveInside(paths.root, relativeOriginal);
		const wasCopied = await copyFileVerified(first.absolutePath, absoluteOriginal, group.hash);
		(wasCopied ? copied : repeated).push(importId);

		const sourceRelativePaths = stableUnique(
			[
				...(existing?.original?.sourceRelativePaths || []),
				...(refreshesPrivateInbox
					? []
					: group.files.map((file) => file.relativePath.split(path.sep).join('/')))
			].filter(Boolean)
		);
		const sourceFilenames = stableUnique([
			...(existing?.original?.sourceFilenames || []),
			...(refreshesPrivateInbox ? [] : group.files.map((file) => file.basename))
		]);
		const crossBatchDuplicates = crossBatchIndex.get(group.hash) || [];
		const existingMetadata = existing?.metadata ? { ...existing.metadata } : null;
		const legacyCoordinates = existingMetadata?.gpsCoordinates || null;
		if (existingMetadata) delete existingMetadata.gpsCoordinates;
		const next = {
			importId,
			kind: existing?.kind || first.kind,
			format: existing?.format || first.supportedFormat || null,
			hash: { algorithm: 'sha256', value: group.hash },
			original: {
				path: relativeOriginal,
				bytes: first.bytes,
				sourceFilenames,
				sourceRelativePaths
			},
			duplicateOf: crossBatchDuplicates,
			metadata: existingMetadata,
			privateTags: {
				...(existing?.privateTags || {}),
				coordinates:
					existing?.privateTags?.coordinates ||
					privateCoordinateTag(existing?.format || first.supportedFormat, legacyCoordinates)
			},
			captureSuggestion: existing?.captureSuggestion || null,
			thumbnail: existing?.thumbnail || null,
			warnings: baseWarnings(group, source.files, crossBatchDuplicates),
			review: mergeReviewDefaults(
				existing?.review,
				group.hash,
				existing?.captureSuggestion || { localValue: null, offset: null }
			)
		};

		if (
			first.kind === 'image' &&
			(options.refreshMetadata ||
				!next.metadata ||
				!next.thumbnail ||
				!(await pathExists(resolveInside(paths.root, next.thumbnail.path))))
		) {
			const relativeThumbnail = 'thumbnails/' + importId + '.jpg';
			imageRequests.push({
				key: importId,
				source: absoluteOriginal,
				output: resolveInside(paths.root, relativeThumbnail),
				maxPixelSize: THUMBNAIL_SIZE,
				quality: THUMBNAIL_QUALITY,
				format: first.supportedFormat,
				relativeThumbnail
			});
		} else if (existing?.warnings) {
			next.warnings.push(
				...existing.warnings.filter((warning) =>
					[
						'capture-time-missing',
						'capture-timezone-missing',
						'private-gps-present',
						'gps-coordinates-unreadable',
						'private-device-metadata-present',
						'private-xmp-present',
						'multi-image-container',
						'orientation-normalized-for-review',
						'review-thumbnail-color-converted',
						'thumbnail-private-metadata-retained',
						'near-uniform-review-output',
						'format-extension-mismatch',
						'image-processing-failed'
					].includes(warning.code)
				)
			);
		}

		nextItems.push(next);
	}

	if (imageRequests.length > 0) {
		console.log(
			'Reading metadata and creating ' +
				imageRequests.length +
				' private orientation-correct thumbnails…'
		);
		const results = await processImages(
			imageRequests.map(({ key, source: input, output, maxPixelSize, quality }) => ({
				key,
				source: input,
				output,
				maxPixelSize,
				quality
			}))
		);
		const requestsByKey = new Map(imageRequests.map((request) => [request.key, request]));

		for (const result of results) {
			const item = nextItems.find((candidate) => candidate.importId === result.key);
			const request = requestsByKey.get(result.key);
			if (!item || !request) throw new Error('Image helper returned an unknown import ID.');
			const captureSuggestion = parseExifCapture(result.capture);
			item.metadata = {
				formatIdentifier: result.formatIdentifier,
				imageCount: result.imageCount,
				pixelWidth: result.pixelWidth,
				pixelHeight: result.pixelHeight,
				orientation: result.orientation,
				orientedWidth: result.orientedWidth,
				orientedHeight: result.orientedHeight,
				colorModel: result.colorModel,
				profileName: result.profileName,
				gpsPresent: result.gpsPresent,
				deviceMetadataPresent: result.deviceMetadataPresent,
				xmpPresent: result.xmpPresent
			};
			item.privateTags = {
				...(item.privateTags || {}),
				coordinates: privateCoordinateTag(item.format, result.gpsCoordinates)
			};
			item.captureSuggestion = captureSuggestion;
			item.warnings.push(...metadataWarnings(result, captureSuggestion, request.format));
			if (result.ok) {
				await chmod(request.output, 0o600);
				item.thumbnail = {
					path: request.relativeThumbnail,
					width: result.outputWidth,
					height: result.outputHeight,
					format: 'jpeg',
					colorSpace: result.outputProfileName || 'sRGB',
					orientationNormalized: true,
					privateMetadataRemoved:
						result.outputGpsPresent === false &&
						result.outputDeviceMetadataPresent === false &&
						result.outputSensitiveMetadata?.length === 0,
					pixelToolchain: result.pixelToolchain,
					entropy: result.outputEntropy,
					nearUniform: result.nearUniformOutput
				};
				item.review = mergeReviewDefaults(
					existingByHash.get(item.hash.value)?.review,
					item.hash.value,
					captureSuggestion
				);
			}
		}
	}

	nextItems.sort((left, right) => {
		const leftTime = left.captureSuggestion?.localValue || '9999';
		const rightTime = right.captureSuggestion?.localValue || '9999';
		return leftTime.localeCompare(rightTime) || left.importId.localeCompare(right.importId);
	});

	const timestamp = nowIso();
	const sourceRoots = stableUnique([
		...(existingManifest?.sourceRoots || []),
		...(refreshesPrivateInbox ? [] : [source.root])
	]);
	const manifest = {
		schemaVersion: MANIFEST_SCHEMA_VERSION,
		batch: options.batch,
		createdAt: existingManifest?.createdAt || timestamp,
		updatedAt: timestamp,
		sourceRoots,
		toolchain: {
			metadata: 'Apple ImageIO',
			image: 'libheif-js for HEIC; sharp for JPEG/PNG',
			thumbnail: {
				format: 'jpeg',
				maxPixelSize: THUMBNAIL_SIZE,
				quality: THUMBNAIL_QUALITY,
				colorSpace: 'sRGB',
				orientationNormalized: true
			},
			platform: process.platform,
			architecture: process.arch
		},
		batchWarnings: source.warnings,
		items: nextItems
	};
	await writeJsonAtomic(paths.manifest, manifest);

	const counts = nextItems.reduce((result, item) => {
		result[item.kind] = (result[item.kind] || 0) + 1;
		return result;
	}, {});
	const failures = nextItems.filter((item) =>
		item.warnings.some((warning) => warning.code === 'image-processing-failed')
	);
	console.log(
		[
			'Private batch ready: ' + options.batch,
			'Unique items: ' +
				nextItems.length +
				' (' +
				Object.entries(counts)
					.map(([key, value]) => key + ': ' + value)
					.join(', ') +
				')',
			'New private copies: ' + copied.length,
			'Already present by content hash: ' + repeated.length,
			'Manifest: ' + path.relative(process.cwd(), paths.manifest),
			'Nothing was written to static/ or build/.'
		].join('\n')
	);
	if (failures.length > 0) {
		throw new Error(
			failures.length + ' image(s) could not be processed; see the private manifest warnings.'
		);
	}
}

run().catch((error) => {
	console.error('Photo import failed: ' + error.message);
	process.exitCode = 1;
});
