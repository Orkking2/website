import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	normalizeReviewPatch,
	nowIso,
	readManifest,
	resolveInside,
	reviewIssues,
	validateBatchName,
	writeJsonAtomic
} from './lib/core.mjs';

const ASSET_DIRECTORY = fileURLToPath(new URL('./review/', import.meta.url));

function usage() {
	console.log(
		[
			'Usage: npm run photos:review -- --batch <name> [--port <number>] [--no-open]',
			'',
			'Starts a loopback-only private review workspace. Changes save continuously to the',
			'Git-ignored batch manifest. Press Ctrl+C in the terminal to stop it.'
		].join('\n')
	);
}

function parseArguments(arguments_) {
	const options = { batch: null, port: 4179, open: true };
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
		if (argument === '--port') {
			options.port = Number(arguments_[++index]);
			if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) {
				throw new Error('--port must be an integer from 1024 through 65535.');
			}
			continue;
		}
		if (argument === '--no-open') {
			options.open = false;
			continue;
		}
		throw new Error('Unknown option: ' + argument);
	}
	if (!options.batch) throw new Error('--batch <name> is required.');
	options.batch = validateBatchName(options.batch);
	return options;
}

function secureEqual(left, right) {
	if (typeof left !== 'string' || typeof right !== 'string') return false;
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function writeResponse(response, status, body, contentType) {
	response.writeHead(status, {
		'Content-Type': contentType,
		'Cache-Control': 'no-store, private',
		'Cross-Origin-Resource-Policy': 'same-origin',
		'Referrer-Policy': 'no-referrer',
		'X-Content-Type-Options': 'nosniff'
	});
	response.end(body);
}

function jsonResponse(response, status, body) {
	writeResponse(response, status, JSON.stringify(body), 'application/json; charset=utf-8');
}

async function readBody(request) {
	const chunks = [];
	let length = 0;
	for await (const chunk of request) {
		length += chunk.length;
		if (length > 64 * 1024) throw new Error('Request body exceeds 64 KiB.');
		chunks.push(chunk);
	}
	return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function clientItem(item, token) {
	return {
		importId: item.importId,
		sourceFilename: item.original?.sourceFilenames?.[0] || 'unknown',
		thumbnailUrl: '/thumbnail/' + encodeURIComponent(item.importId) + '?token=' + token,
		metadata: item.metadata,
		captureSuggestion: item.captureSuggestion,
		warnings: item.warnings || [],
		review: item.review,
		issues: reviewIssues(item)
	};
}

function reviewState(manifest, token) {
	const items = (manifest.items || [])
		.filter((item) => item.kind === 'image' && item.thumbnail)
		.map((item) => clientItem(item, token));
	return {
		batch: manifest.batch,
		updatedAt: manifest.updatedAt,
		items,
		nonImageItems: (manifest.items || []).filter((item) => item.kind !== 'image').length,
		batchWarnings: manifest.batchWarnings || []
	};
}

async function launchBrowser(url) {
	const command =
		process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
	const arguments_ = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
	const child = spawn(command, arguments_, { detached: true, stdio: 'ignore' });
	child.on('error', () => {});
	child.unref();
}

async function run() {
	const options = parseArguments(process.argv.slice(2));
	const { manifest: initialManifest, paths } = await readManifest(options.batch);
	let manifest = initialManifest;
	let saveQueue = Promise.resolve();
	const token = randomBytes(24).toString('base64url');
	const htmlTemplate = await readFile(path.join(ASSET_DIRECTORY, 'index.html'), 'utf8');
	const stylesheet = await readFile(path.join(ASSET_DIRECTORY, 'review.css'), 'utf8');
	const clientScript = await readFile(path.join(ASSET_DIRECTORY, 'review-client.js'), 'utf8');

	function authorized(request, url) {
		const headerToken = request.headers['x-photo-review-token'];
		const queryToken = url.searchParams.get('token');
		return secureEqual(headerToken || queryToken, token);
	}

	const server = createServer(async (request, response) => {
		const host = request.headers.host || '';
		if (!/^(?:127\.0\.0\.1|localhost):\d+$/.test(host)) {
			jsonResponse(response, 403, { error: 'This private workspace is loopback-only.' });
			return;
		}

		const url = new URL(request.url || '/', 'http://' + host);
		try {
			if (request.method === 'GET' && url.pathname === '/') {
				const html = htmlTemplate
					.replace('__PHOTO_REVIEW_TOKEN__', token)
					.replace('__PHOTO_REVIEW_BATCH__', options.batch);
				response.writeHead(200, {
					'Content-Type': 'text/html; charset=utf-8',
					'Cache-Control': 'no-store, private',
					'Content-Security-Policy':
						"default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
					'Cross-Origin-Opener-Policy': 'same-origin',
					'Cross-Origin-Resource-Policy': 'same-origin',
					'Referrer-Policy': 'no-referrer',
					'X-Content-Type-Options': 'nosniff'
				});
				response.end(html);
				return;
			}
			if (request.method === 'GET' && url.pathname === '/review.css') {
				writeResponse(response, 200, stylesheet, 'text/css; charset=utf-8');
				return;
			}
			if (request.method === 'GET' && url.pathname === '/review-client.js') {
				writeResponse(response, 200, clientScript, 'text/javascript; charset=utf-8');
				return;
			}
			if (!authorized(request, url)) {
				jsonResponse(response, 403, { error: 'Missing or invalid private review token.' });
				return;
			}
			if (request.method === 'GET' && url.pathname === '/api/state') {
				jsonResponse(response, 200, reviewState(manifest, token));
				return;
			}
			if (request.method === 'GET' && url.pathname.startsWith('/thumbnail/')) {
				const importId = decodeURIComponent(url.pathname.slice('/thumbnail/'.length));
				const item = manifest.items.find(
					(candidate) => candidate.importId === importId && candidate.kind === 'image'
				);
				if (!item?.thumbnail?.path) {
					jsonResponse(response, 404, { error: 'Thumbnail not found.' });
					return;
				}
				const thumbnail = resolveInside(paths.root, item.thumbnail.path);
				const body = await readFile(thumbnail);
				writeResponse(response, 200, body, 'image/jpeg');
				return;
			}
			if (request.method === 'PATCH' && url.pathname.startsWith('/api/items/')) {
				const importId = decodeURIComponent(url.pathname.slice('/api/items/'.length));
				const patch = await readBody(request);
				const itemIndex = manifest.items.findIndex((candidate) => candidate.importId === importId);
				if (itemIndex === -1 || manifest.items[itemIndex].kind !== 'image') {
					jsonResponse(response, 404, { error: 'Photo record not found.' });
					return;
				}

				const updatedReview = normalizeReviewPatch(manifest.items[itemIndex].review || {}, patch);
				const duplicate = manifest.items.find(
					(candidate, index) =>
						index !== itemIndex &&
						candidate.kind === 'image' &&
						candidate.review?.stableId === updatedReview.stableId
				);
				if (duplicate) throw new Error('Stable photo ID is already used in this batch.');

				manifest.items[itemIndex] = {
					...manifest.items[itemIndex],
					review: updatedReview
				};
				manifest.updatedAt = nowIso();
				saveQueue = saveQueue.then(() => writeJsonAtomic(paths.manifest, manifest));
				await saveQueue;
				jsonResponse(response, 200, clientItem(manifest.items[itemIndex], token));
				return;
			}

			jsonResponse(response, 404, { error: 'Not found.' });
		} catch (error) {
			jsonResponse(response, 400, { error: error.message });
		}
	});

	await new Promise((resolve, reject) => {
		const onError = (error) => reject(error);
		server.once('error', onError);
		server.listen(options.port, '127.0.0.1', () => {
			server.off('error', onError);
			resolve();
		});
	});
	server.on('error', (error) => console.error('Photo review server error: ' + error.message));
	const url = 'http://127.0.0.1:' + options.port + '/';
	console.log('Private photography review workspace: ' + url);
	console.log('Batch: ' + options.batch + ' · loopback only · Ctrl+C to stop');
	if (options.open) await launchBrowser(url);

	const close = () => {
		server.close(() => process.exit(0));
	};
	process.on('SIGINT', close);
	process.on('SIGTERM', close);
}

run().catch((error) => {
	console.error('Photo review failed: ' + error.message);
	process.exitCode = 1;
});
