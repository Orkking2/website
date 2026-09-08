import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import decodeHeic from 'heic-decode';
import sharp from 'sharp';
import { ensurePrivateDirectory, hashFile, pathExists, PRIVATE_PHOTO_ROOT } from './core.mjs';

const TOOL_SOURCE = fileURLToPath(new URL('../macos-image-tool.m', import.meta.url));
const TOOL_DIRECTORY = path.join(PRIVATE_PHOTO_ROOT, '.tools');
const TOOL_BINARY = path.join(TOOL_DIRECTORY, 'macos-image-tool');
const TOOL_STAMP = path.join(TOOL_DIRECTORY, 'macos-image-tool.sha256');
const PROBE_DIRECTORY = path.join(TOOL_DIRECTORY, 'metadata-probes');

function runProcess(command, arguments_, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, arguments_, {
			cwd: options.cwd,
			env: options.env || process.env,
			stdio: ['pipe', 'pipe', 'pipe']
		});
		const stdout = [];
		const stderr = [];

		child.stdout.on('data', (chunk) => stdout.push(chunk));
		child.stderr.on('data', (chunk) => stderr.push(chunk));
		child.on('error', reject);
		child.on('close', (code, signal) => {
			const output = Buffer.concat(stdout).toString('utf8');
			const errors = Buffer.concat(stderr).toString('utf8');
			if (code === 0) resolve({ stdout: output, stderr: errors });
			else {
				const reason = signal ? ' with signal ' + signal : ' with exit code ' + code;
				reject(
					new Error(
						path.basename(command) +
							' failed' +
							reason +
							'.' +
							(errors.trim() ? '\n' + errors.trim() : '')
					)
				);
			}
		});

		if (options.input !== undefined) child.stdin.end(options.input);
		else child.stdin.end();
	});
}

export async function ensureAppleImageTool() {
	if (process.platform !== 'darwin') {
		throw new Error(
			'The private HEIC intake tool currently requires macOS because it uses Apple ImageIO and Core Graphics. Committed publication masters remain ordinary JPEG files for portable builds.'
		);
	}

	await ensurePrivateDirectory(TOOL_DIRECTORY);
	const sourceHash = await hashFile(TOOL_SOURCE);
	let compiledHash = null;
	if ((await pathExists(TOOL_BINARY)) && (await pathExists(TOOL_STAMP))) {
		compiledHash = (await readFile(TOOL_STAMP, 'utf8')).trim();
	}

	if (compiledHash !== sourceHash) {
		const moduleCache = path.join(TOOL_DIRECTORY, 'clang-module-cache');
		await ensurePrivateDirectory(moduleCache);
		await runProcess('/usr/bin/clang', [
			'-O2',
			'-fobjc-arc',
			'-fmodules-cache-path=' + moduleCache,
			'-framework',
			'Foundation',
			'-framework',
			'ImageIO',
			'-framework',
			'CoreGraphics',
			TOOL_SOURCE,
			'-o',
			TOOL_BINARY
		]);
		await chmod(TOOL_BINARY, 0o700);
		await writeFile(TOOL_STAMP, sourceHash + '\n', { mode: 0o600 });
	}

	return TOOL_BINARY;
}

/**
 * Read what a source file says about itself, without decoding its pixels.
 *
 * The helper reports metadata alongside a render, so this asks for the smallest
 * render it can and keeps only the metadata. It exists to fill in fields a record
 * was created without — coordinates recorded before they were kept, a capture time
 * an earlier pipeline dropped — from the original that is still in the library.
 */
export async function readImageMetadata(sources) {
	if (sources.length === 0) return [];
	const binary = await ensureAppleImageTool();
	await ensurePrivateDirectory(PROBE_DIRECTORY);
	const requests = sources.map((source, index) => ({
		key: `probe-${index}`,
		source,
		output: path.join(PROBE_DIRECTORY, `meta-${randomBytes(6).toString('hex')}.jpg`),
		maxPixelSize: 16,
		quality: 0.5
	}));
	let stdout;
	try {
		({ stdout } = await runProcess(binary, [], { input: JSON.stringify(requests) }));
	} finally {
		await Promise.all(requests.map((request) => rm(request.output, { force: true })));
	}
	let results;
	try {
		results = JSON.parse(stdout);
	} catch (error) {
		throw new Error('The Apple image helper returned invalid JSON: ' + error.message, {
			cause: error
		});
	}
	if (!Array.isArray(results) || results.length !== sources.length)
		throw new Error('The Apple image helper returned an unexpected number of results.');
	return results;
}

export async function processImages(requests) {
	if (requests.length === 0) return [];
	for (const request of requests) await mkdir(path.dirname(request.output), { recursive: true });

	const binary = await ensureAppleImageTool();
	await ensurePrivateDirectory(PROBE_DIRECTORY);
	const probeRequests = requests.map((request) => ({
		...request,
		output: path.join(PROBE_DIRECTORY, request.key + '-' + randomBytes(6).toString('hex') + '.jpg'),
		maxPixelSize: 16,
		quality: 0.5
	}));
	let stdout;
	try {
		({ stdout } = await runProcess(binary, [], {
			input: JSON.stringify(probeRequests)
		}));
	} finally {
		await Promise.all(probeRequests.map((request) => rm(request.output, { force: true })));
	}

	let metadataResults;
	try {
		metadataResults = JSON.parse(stdout);
	} catch (error) {
		throw new Error('The Apple image helper returned invalid JSON: ' + error.message, {
			cause: error
		});
	}

	if (!Array.isArray(metadataResults) || metadataResults.length !== requests.length) {
		throw new Error('The Apple image helper returned an unexpected number of results.');
	}

	const results = [];
	for (let index = 0; index < requests.length; index += 1) {
		const request = requests[index];
		const metadata = metadataResults[index];
		if (!metadata.ok) {
			results.push(metadata);
			continue;
		}

		const temporaryOutput =
			request.output + '.' + process.pid + '.' + randomBytes(6).toString('hex') + '.tmp';
		try {
			let pipeline;
			let decodedWidth = metadata.orientedWidth;
			let decodedHeight = metadata.orientedHeight;
			if (['public.heic', 'public.heif'].includes(metadata.formatIdentifier)) {
				const decoded = await decodeHeic({ buffer: await readFile(request.source) });
				decodedWidth = decoded.width;
				decodedHeight = decoded.height;
				pipeline = sharp(decoded.data, {
					raw: {
						width: decoded.width,
						height: decoded.height,
						channels: 4
					}
				});
			} else {
				pipeline = sharp(request.source).autoOrient();
			}

			const info = await pipeline
				.resize({
					width: request.maxPixelSize,
					height: request.maxPixelSize,
					fit: 'inside',
					withoutEnlargement: true
				})
				.toColourspace('srgb')
				.jpeg({
					quality: Math.round(request.quality * 100),
					progressive: true,
					chromaSubsampling: '4:4:4'
				})
				.withIccProfile('srgb')
				.toFile(temporaryOutput);
			const outputMetadata = await sharp(temporaryOutput).metadata();
			const statistics = await sharp(temporaryOutput).stats();
			const outputSensitiveMetadata = [];
			if (outputMetadata.exif) outputSensitiveMetadata.push('exif');
			if (outputMetadata.xmp) outputSensitiveMetadata.push('xmp');
			if (outputMetadata.iptc) outputSensitiveMetadata.push('iptc');
			if (outputMetadata.comments?.length) outputSensitiveMetadata.push('comments');
			const nearUniformOutput =
				statistics.entropy < 0.01 ||
				statistics.channels.slice(0, 3).every((channel) => channel.stdev < 0.25);

			await rename(temporaryOutput, request.output);
			results.push({
				...metadata,
				ok: true,
				error: null,
				orientedWidth: decodedWidth,
				orientedHeight: decodedHeight,
				outputWidth: info.width,
				outputHeight: info.height,
				outputProfileName: 'sRGB',
				outputGpsPresent: false,
				outputDeviceMetadataPresent: false,
				outputSensitiveMetadata,
				outputEntropy: statistics.entropy,
				nearUniformOutput,
				pixelToolchain: ['public.heic', 'public.heif'].includes(metadata.formatIdentifier)
					? 'libheif-js RGBA decode + sharp'
					: 'sharp'
			});
		} catch (error) {
			await rm(temporaryOutput, { force: true });
			results.push({
				...metadata,
				ok: false,
				error: 'Pixel decode/output failed: ' + error.message,
				outputWidth: null,
				outputHeight: null,
				outputProfileName: null,
				outputGpsPresent: null,
				outputDeviceMetadataPresent: null,
				outputSensitiveMetadata: null,
				outputEntropy: null,
				nearUniformOutput: null,
				pixelToolchain: null
			});
		}
	}

	return results;
}
