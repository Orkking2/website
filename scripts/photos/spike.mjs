import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { processImages } from './lib/apple-image-tool.mjs';
import { collectInputFiles, hashFile } from './lib/core.mjs';

function usage() {
	console.log(
		[
			'Usage: npm run photos:spike -- <folder> [--json]',
			'',
			'Runs a read-only compatibility spike against a phone-export folder. Temporary review images',
			'are written only under the operating system temporary directory and removed afterward.'
		].join('\n')
	);
}

function parseArguments(arguments_) {
	let source = null;
	let json = false;
	for (const argument of arguments_) {
		if (argument === '--help' || argument === '-h') {
			usage();
			process.exit(0);
		}
		if (argument === '--json') {
			json = true;
			continue;
		}
		if (argument.startsWith('-')) throw new Error('Unknown option: ' + argument);
		if (source) throw new Error('Provide exactly one source folder.');
		source = argument;
	}
	if (!source) throw new Error('A source folder is required.');
	return { source, json };
}

function increment(map, value) {
	const label = value === null || value === undefined || value === '' ? 'unknown' : String(value);
	map.set(label, (map.get(label) || 0) + 1);
}

function mapToObject(map) {
	return Object.fromEntries([...map].sort(([left], [right]) => left.localeCompare(right)));
}

async function run() {
	const options = parseArguments(process.argv.slice(2));
	const source = await collectInputFiles(options.source);
	const supported = source.files.filter((file) => file.kind === 'image');
	if (supported.length === 0)
		throw new Error('The source folder contains no supported HEIC, JPEG, or PNG images.');

	const temporary = await mkdtemp(path.join(os.tmpdir(), 'nebve-photo-spike-'));
	try {
		console.log(
			'Hashing ' + source.files.length + ' files and probing ' + supported.length + ' images…'
		);
		const hashes = [];
		for (const file of source.files) hashes.push(await hashFile(file.absolutePath));

		const requests = supported.map((file, index) => ({
			key: String(index),
			source: file.absolutePath,
			output: path.join(temporary, String(index) + '.jpg'),
			maxPixelSize: 720,
			quality: 0.82
		}));
		const results = await processImages(requests);
		const formats = new Map();
		const dimensions = new Map();
		const orientations = new Map();
		const profiles = new Map();
		const outputProfiles = new Map();
		const pixelToolchains = new Map();
		const captureValues = [];

		for (const result of results) {
			increment(formats, result.formatIdentifier);
			increment(dimensions, result.pixelWidth + ' × ' + result.pixelHeight);
			increment(orientations, result.orientation);
			increment(profiles, result.profileName);
			increment(outputProfiles, result.outputProfileName);
			increment(pixelToolchains, result.pixelToolchain);
			if (result.capture?.dateTimeOriginal) captureValues.push(result.capture.dateTimeOriginal);
		}

		const summary = {
			sourceFiles: source.files.length,
			supportedImages: supported.length,
			uniqueContentHashes: new Set(hashes).size,
			exactDuplicateFiles: hashes.length - new Set(hashes).size,
			kinds: Object.fromEntries(
				[...new Set(source.files.map((file) => file.kind))]
					.sort()
					.map((kind) => [kind, source.files.filter((file) => file.kind === kind).length])
			),
			formats: mapToObject(formats),
			dimensions: mapToObject(dimensions),
			orientations: mapToObject(orientations),
			sourceProfiles: mapToObject(profiles),
			reviewProfiles: mapToObject(outputProfiles),
			pixelToolchains: mapToObject(pixelToolchains),
			captureRange:
				captureValues.length > 0
					? {
							first: captureValues.toSorted()[0],
							last: captureValues.toSorted().at(-1)
						}
					: null,
			explicitTimezoneOffsets: results.filter(
				(result) =>
					result.capture?.offsetTimeOriginal ||
					result.capture?.offsetTimeDigitized ||
					result.capture?.offsetTime
			).length,
			missingTimezoneOffsets: results.filter(
				(result) =>
					result.ok &&
					result.capture?.dateTimeOriginal &&
					!result.capture?.offsetTimeOriginal &&
					!result.capture?.offsetTimeDigitized &&
					!result.capture?.offsetTime
			).length,
			gpsPresent: results.filter((result) => result.gpsPresent).length,
			readableCoordinateSuggestions: results.filter(
				(result) =>
					Number.isFinite(result.gpsCoordinates?.latitude) &&
					Number.isFinite(result.gpsCoordinates?.longitude)
			).length,
			deviceMetadataPresent: results.filter((result) => result.deviceMetadataPresent).length,
			xmpPresent: results.filter((result) => result.xmpPresent).length,
			orientationCorrectOutputs: results.filter(
				(result) =>
					result.ok &&
					Math.max(result.outputWidth, result.outputHeight) <= 720 &&
					result.orientedWidth >= result.orientedHeight ===
						result.outputWidth >= result.outputHeight
			).length,
			cleanReviewOutputs: results.filter(
				(result) =>
					result.ok &&
					result.outputGpsPresent === false &&
					result.outputDeviceMetadataPresent === false &&
					result.outputSensitiveMetadata?.length === 0
			).length,
			nearUniformOutputs: results.filter((result) => result.nearUniformOutput).length,
			failures: results
				.filter((result) => !result.ok)
				.map((result) => ({ key: result.key, error: result.error }))
		};

		if (options.json) console.log(JSON.stringify(summary, null, '\t'));
		else {
			console.log(
				[
					'Photo toolchain spike',
					'Source files: ' + summary.sourceFiles,
					'Supported images: ' + summary.supportedImages,
					'Unique content hashes: ' + summary.uniqueContentHashes,
					'Exact duplicate files: ' + summary.exactDuplicateFiles,
					'Formats: ' + JSON.stringify(summary.formats),
					'Raw dimensions: ' + JSON.stringify(summary.dimensions),
					'Orientation tags: ' + JSON.stringify(summary.orientations),
					'Source profiles: ' + JSON.stringify(summary.sourceProfiles),
					'Review profiles: ' + JSON.stringify(summary.reviewProfiles),
					'Pixel toolchains: ' + JSON.stringify(summary.pixelToolchains),
					'Capture range: ' +
						(summary.captureRange
							? summary.captureRange.first + ' — ' + summary.captureRange.last
							: 'not found'),
					'Explicit timezone offsets: ' + summary.explicitTimezoneOffsets,
					'Missing timezone offsets: ' + summary.missingTimezoneOffsets,
					'Originals with GPS metadata: ' + summary.gpsPresent,
					'Readable private coordinate suggestions: ' + summary.readableCoordinateSuggestions,
					'Originals with device metadata: ' + summary.deviceMetadataPresent,
					'Orientation-correct outputs: ' +
						summary.orientationCorrectOutputs +
						'/' +
						summary.supportedImages,
					'Review outputs without GPS/device metadata: ' +
						summary.cleanReviewOutputs +
						'/' +
						summary.supportedImages,
					'Near-uniform outputs: ' + summary.nearUniformOutputs,
					'Failures: ' + summary.failures.length
				].join('\n')
			);
		}

		if (summary.failures.length > 0 || summary.nearUniformOutputs > 0) process.exitCode = 1;
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
}

run().catch((error) => {
	console.error('Photo toolchain spike failed: ' + error.message);
	process.exitCode = 1;
});
