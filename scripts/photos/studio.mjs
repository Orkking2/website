import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import { PROJECT_ROOT, pathExists, writeJsonAtomic } from './lib/core.mjs';
import {
	backfillRecord,
	libraryPaths,
	planScan,
	pruneCache,
	scanLibrary,
	watermarkedPreview
} from './library.mjs';
import { UNTITLED, isReady, parsePhoto, photoIssues, titleOf } from '../content/schema.ts';
import { watermarkText } from './watermark.ts';

const ASSET_DIRECTORY = fileURLToPath(new URL('./studio/', import.meta.url));
const CONTENT_DIRECTORY = path.join(PROJECT_ROOT, 'src/content');
// A first run over a large library writes one committed master per photograph.
const BULK_DERIVE_PROMPT = 25;

function usage() {
	console.log(
		[
			'Usage: npm run photos [-- --port <number>] [--open] [--yes] [--prune]',
			'                      [--library <path>]',
			'',
			'Serves the private photo studio over the library in .local/photography/ and',
			'prints its address, the way the dev server does. Pass --open to also launch a',
			'browser. Every photograph there is one this site hosts; edits save straight to',
			'src/content/photography/.photogrid/. Publication happens when you push.'
		].join('\n')
	);
}

function parseArguments(argv) {
	// Not opened by default, matching the dev server: the address is printed to click or to
	// reload in a tab that is already pointed at it.
	const options = { port: 4179, open: false, yes: false, prune: false, library: null };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--help' || argument === '-h') {
			usage();
			process.exit(0);
		} else if (argument === '--port') {
			options.port = Number(argv[++index]);
			if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535)
				throw new Error('--port must be an integer from 1024 through 65535.');
		} else if (argument === '--library') {
			// A library elsewhere, for trying the studio without touching the real one.
			options.library = argv[++index];
			if (!options.library) throw new Error('--library requires a path.');
		} else if (argument === '--open') options.open = true;
		else if (argument === '--no-open') options.open = false;
		else if (argument === '--yes') options.yes = true;
		else if (argument === '--prune') options.prune = true;
		else throw new Error('Unknown option: ' + argument);
	}
	return options;
}

function secureEqual(left, right) {
	if (typeof left !== 'string' || typeof right !== 'string') return false;
	const a = Buffer.from(left);
	const b = Buffer.from(right);
	return a.length === b.length && timingSafeEqual(a, b);
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

const jsonResponse = (response, status, body) =>
	writeResponse(response, status, JSON.stringify(body), 'application/json; charset=utf-8');

async function readBody(request) {
	const chunks = [];
	let length = 0;
	for await (const chunk of request) {
		length += chunk.length;
		if (length > 256 * 1024) throw new Error('Request body exceeds 256 KiB.');
		chunks.push(chunk);
	}
	return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/* ------------------------------------------------------------------ records */

let paths = libraryPaths();
const recordFile = (id) => path.join(paths.records, `${id}.json`);

async function readRecord(id) {
	const file = recordFile(id);
	return parsePhoto(JSON.parse(await readFile(file, 'utf8')), path.basename(file));
}

const optionalText = (value) => {
	if (value === null || value === undefined) return null;
	if (typeof value !== 'string') throw new Error('Expected text.');
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
};

const LOCAL_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
const OFFSET = /^[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00)$/;

/**
 * Apply an edit from the studio to a record.
 *
 * Nothing here is a gate: every field is content you are writing, including the
 * coordinates that appear in the watermark, which you clear by emptying them.
 */
function applyPatch(record, patch) {
	const next = structuredClone(record);
	if ('title' in patch) next.title = optionalText(patch.title);
	if ('caption' in patch) next.caption = optionalText(patch.caption);
	if ('location' in patch) next.location = optionalText(patch.location);
	if ('alt' in patch) next.alt = optionalText(patch.alt);
	if ('decorative' in patch) {
		if (typeof patch.decorative !== 'boolean') throw new Error('decorative must be true or false.');
		next.decorative = patch.decorative;
		if (next.decorative) next.alt = null;
	}
	if ('galleryIncluded' in patch) {
		if (typeof patch.galleryIncluded !== 'boolean')
			throw new Error('galleryIncluded must be true or false.');
		next.gallery = { included: patch.galleryIncluded };
	}
	if ('reviewed' in patch) {
		if (typeof patch.reviewed !== 'boolean') throw new Error('reviewed must be true or false.');
		next.reviewed = patch.reviewed;
		// A title is required of anything served, and is the one required field with a
		// sensible default, so calling a photograph finished fills it rather than blocking.
		if (next.reviewed && !next.title) next.title = UNTITLED;
	}
	if ('capturedLocal' in patch) {
		const value = optionalText(patch.capturedLocal);
		if (!value || !LOCAL_TIME.test(value))
			throw new Error('Capture time must read YYYY-MM-DDTHH:MM:SS.');
		next.captured.local = value.length === 16 ? `${value}:00` : value;
	}
	if ('capturedOffset' in patch) {
		const value = optionalText(patch.capturedOffset);
		if (value && !OFFSET.test(value)) throw new Error('A UTC offset reads ±HH:MM.');
		next.captured.offset = value;
	}
	if ('coordinates' in patch) {
		const value = patch.coordinates;
		if (value === null) delete next.coordinates;
		else {
			const latitude = Number(value?.latitude);
			const longitude = Number(value?.longitude);
			if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
				throw new Error('Latitude must be a number between -90 and 90.');
			if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
				throw new Error('Longitude must be a number between -180 and 180.');
			next.coordinates = { latitude, longitude };
		}
	}
	return parsePhoto(next, `${record.id}.json`);
}

/* ------------------------------------------------------------------- essays */

async function readEssays() {
	const essays = [];
	// Any page in the tree that names its own photographs is an essay, wherever it sits.
	async function visit(directory, segments) {
		for (const entry of (await readdir(directory, { withFileTypes: true }).catch(() => [])).sort(
			(a, b) => a.name.localeCompare(b.name)
		)) {
			if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
			const child = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				await visit(child, [...segments, entry.name]);
				continue;
			}
			if (!entry.isFile() || !/\.(md|svx)$/.test(entry.name)) continue;
			const name = path.parse(entry.name).name;
			const own = name === 'index' ? segments : [...segments, name];
			const source = await readFile(child, 'utf8');
			const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
			if (!match) continue;
			const document = parseDocument(match[1]);
			const data = document.toJS({ maxAliasCount: 0 }) || {};
			if (!data.images || typeof data.images !== 'object') continue;
			// images is a map of the page's own names to photo IDs, in the order they were written.
			essays.push({
				route: own.length ? `/${own.join('/')}` : '/',
				title: data.title || name,
				images: Object.entries(data.images).map(([alias, id]) => ({ alias, id })),
				cover: data.cover || null,
				file: child
			});
		}
	}
	await visit(CONTENT_DIRECTORY, []);
	return essays;
}

/**
 * Write an essay's photographs, in order, back into its own frontmatter.
 *
 * The essay file is the single source of truth for which photographs belong to
 * it, what each is called there, and which is the cover. Nothing is written into
 * the photograph records, so there is no second copy to keep in step.
 *
 * The whole list is replaced each time, because every operation the studio offers
 * — adding, removing, renaming, reordering — is a new list.
 */
async function updateEssay(route, patch) {
	const essay = (await readEssays()).find((candidate) => candidate.route === route);
	if (!essay) throw new Error(`No page at "${route}" names its own photographs.`);
	const source = await readFile(essay.file, 'utf8');
	const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(source);
	if (!match) throw new Error(`${essay.route}: Missing frontmatter.`);
	const document = parseDocument(match[2], { uniqueKeys: true });

	let images = essay.images;
	const wasNamed = new Map(essay.images.map((image) => [image.id, image.alias]));
	if (Array.isArray(patch.images)) {
		const seen = new Set();
		const next = {};
		for (const { alias, id } of patch.images) {
			if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(alias || ''))
				throw new Error(
					`"${alias}" is not a usable name for a photograph in an essay. Use lowercase words joined by hyphens.`
				);
			if (seen.has(alias)) throw new Error(`This essay already has a photograph named "${alias}".`);
			if (!(await pathExists(recordFile(id)))) throw new Error(`Unknown photograph "${id}".`);
			seen.add(alias);
			next[alias] = id;
		}
		document.set('images', next);
		images = Object.entries(next).map(([alias, id]) => ({ alias, id }));
	}

	// The cover names one of this essay's own photographs. Whatever the change was, it must
	// still name one afterwards, so a removed or renamed cover falls back to the first image.
	const names = images.map((image) => image.alias);
	const requested = 'cover' in patch ? patch.cover : essay.cover;
	const cover = names.includes(requested) ? requested : (names[0] ?? null);
	if (cover === null) document.delete('cover');
	else document.set('cover', cover);

	// A name is what the prose calls a photograph, so renaming one here renames it there too.
	// Without this the studio could silently break <Photo of="..."> and every #name link to it.
	const renames = images
		.filter((image) => wasNamed.has(image.id) && wasNamed.get(image.id) !== image.alias)
		.map((image) => [wasNamed.get(image.id), image.alias]);
	let body = source.slice(match[0].length);
	for (const [from, to] of renames) {
		const name = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		body = body
			.replace(new RegExp(`(<Photo\\b[^>]*?\\bof=)("|')${name}\\2`, 'g'), `$1$2${to}$2`)
			.replace(new RegExp(`\\(#${name}\\)`, 'g'), `(#${to})`);
	}

	// lineWidth 0 keeps every field the author already wrote on its own single line.
	const frontmatter = document.toString({ lineWidth: 0 }).replace(/\n$/, '');
	await writeFile(essay.file, `${match[1]}${frontmatter}${match[3]}${body}`);
	return (await readEssays()).find((candidate) => candidate.route === route);
}

/* -------------------------------------------------------------------- state */

// Backfill is attempted once per photograph per run. It has work to do only for records
// written before a field was kept, and what it recovers is saved into the record itself.
const backfilled = new Map();

async function backfill(record, item) {
	// Only the outcome is remembered, never the record it produced: anything recovered was
	// written to disk, so the caller's freshly read record already has it. Caching the record
	// itself would replay a stale copy over every edit made since the studio started.
	const attempted = backfilled.get(record.id);
	if (attempted) return { ...attempted, record };
	let outcome;
	let current = record;
	try {
		const { record: next, filled, absent } = await backfillRecord(record, item, paths);
		outcome = { filled, absent, error: null };
		if (filled.length) {
			current = parsePhoto(next, `${record.id}.json`);
			await writeJsonAtomic(recordFile(record.id), current, 0o644);
		}
	} catch (error) {
		// Soft on purpose: one unreadable original is reported on its own photograph, and
		// every other photograph in the library still loads.
		outcome = { filled: [], absent: [], error: error.message };
	}
	backfilled.set(record.id, outcome);
	return { ...outcome, record: current };
}

/** One photograph as the studio shows it: the record, what it still needs, and where it belongs. */
function photoEntry({
	id,
	source,
	record,
	essay,
	token,
	filled = [],
	absent = [],
	backfillError = null
}) {
	const issues = photoIssues(record);
	return {
		id,
		source,
		record,
		issues,
		ready: isReady(record),
		title: titleOf(record),
		essay: essay ?? null,
		filled,
		absent,
		backfillError,
		watermark: watermarkText(record),
		previewUrl: `/preview/${encodeURIComponent(id)}?token=${token}&v=${Date.now()}`
	};
}

/** Which essay each photograph belongs to, read from the essays themselves. */
function essayIndex(essays) {
	const index = new Map();
	for (const essay of essays)
		for (const image of essay.images)
			index.set(image.id, { route: essay.route, title: essay.title, alias: image.alias });
	return index;
}

async function studioState(library, token) {
	const essays = await readEssays();
	const belongsTo = essayIndex(essays);
	const photos = [];
	for (const item of library.items) {
		let record;
		try {
			record = await readRecord(item.id);
		} catch (error) {
			photos.push({ id: item.id, source: item.source, error: error.message });
			continue;
		}
		const recovered = await backfill(record, item);
		photos.push(
			photoEntry({
				id: item.id,
				source: item.source,
				record: recovered.record,
				essay: belongsTo.get(item.id),
				token,
				filled: recovered.filled,
				absent: recovered.absent,
				backfillError: recovered.error
			})
		);
	}
	// Newest first, matching the gallery's own order.
	photos.sort((a, b) =>
		(b.record?.captured.local || '').localeCompare(a.record?.captured.local || '')
	);
	return { photos, essays, skipped: library.skipped };
}

async function launchBrowser(url) {
	const command =
		process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
	const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
	const child = spawn(command, args, { detached: true, stdio: 'ignore' });
	child.on('error', () => {});
	child.unref();
}

function confirm(question) {
	return new Promise((resolve) => {
		process.stdout.write(question);
		process.stdin.setEncoding('utf8');
		process.stdin.once('data', (value) => {
			process.stdin.pause();
			resolve(/^y(es)?$/i.test(value.trim()));
		});
		process.stdin.resume();
	});
}

async function run() {
	const options = parseArguments(process.argv.slice(2));
	if (options.library) paths = libraryPaths(path.resolve(options.library));
	const plan = await planScan(paths);
	console.log(
		`Library: ${plan.total} photograph(s) in ${path.relative(PROJECT_ROOT, paths.root)}` +
			(plan.skipped.length ? `, ${plan.skipped.length} other file(s) ignored` : '')
	);
	if (plan.fresh >= BULK_DERIVE_PROMPT && !options.yes) {
		// Not an editorial gate: each new photograph adds a committed master to the repository.
		const proceed = await confirm(
			`${plan.fresh} new photograph(s) will be read, and a publication master committed for each.\n` +
				`That is roughly ${Math.round((plan.fresh * 1.4) / 10) / 100} GB of history if they are all kept.\n` +
				`Continue? [y/N] `
		);
		if (!proceed) {
			console.log('Nothing was read. Curate .local/photography/ and run again.');
			return;
		}
	}

	let library = await scanLibrary({
		paths,
		onProgress: ({ relative }) => console.log(`  reading ${relative}`)
	});
	if (library.derivedCount) console.log(`Read ${library.derivedCount} new photograph(s).`);
	if (options.prune) {
		const removed = await pruneCache(
			library.items.map((item) => item.id),
			paths
		);
		if (removed.length) console.log(`Pruned ${removed.length} stale cache file(s).`);
	}

	const token = randomBytes(24).toString('base64url');
	const html = (await readFile(path.join(ASSET_DIRECTORY, 'index.html'), 'utf8')).replace(
		'__STUDIO_TOKEN__',
		token
	);
	const stylesheet = await readFile(path.join(ASSET_DIRECTORY, 'studio.css'), 'utf8');
	const clientScript = await readFile(path.join(ASSET_DIRECTORY, 'studio-client.js'), 'utf8');

	const authorized = (request, url) =>
		secureEqual(request.headers['x-studio-token'] || url.searchParams.get('token'), token);

	const server = createServer(async (request, response) => {
		const host = request.headers.host || '';
		if (!/^(?:127\.0\.0\.1|localhost):\d+$/.test(host)) {
			jsonResponse(response, 403, { error: 'This private workspace is loopback-only.' });
			return;
		}
		const url = new URL(request.url || '/', 'http://' + host);
		try {
			if (request.method === 'GET' && url.pathname === '/') {
				response.writeHead(200, {
					'Content-Type': 'text/html; charset=utf-8',
					'Cache-Control': 'no-store, private',
					'Content-Security-Policy':
						"default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
					'Cross-Origin-Opener-Policy': 'same-origin',
					'Referrer-Policy': 'no-referrer',
					'X-Content-Type-Options': 'nosniff'
				});
				response.end(html);
				return;
			}
			if (request.method === 'GET' && url.pathname === '/studio.css') {
				writeResponse(response, 200, stylesheet, 'text/css; charset=utf-8');
				return;
			}
			if (request.method === 'GET' && url.pathname === '/studio-client.js') {
				writeResponse(response, 200, clientScript, 'text/javascript; charset=utf-8');
				return;
			}
			if (!authorized(request, url)) {
				jsonResponse(response, 403, { error: 'Missing or invalid studio token.' });
				return;
			}
			if (request.method === 'GET' && url.pathname === '/api/state') {
				jsonResponse(response, 200, await studioState(library, token));
				return;
			}
			if (request.method === 'POST' && url.pathname === '/api/rescan') {
				library = await scanLibrary({ paths });
				jsonResponse(response, 200, await studioState(library, token));
				return;
			}
			if (request.method === 'GET' && url.pathname.startsWith('/preview/')) {
				const id = decodeURIComponent(url.pathname.slice('/preview/'.length));
				if (!library.items.some((item) => item.id === id)) {
					jsonResponse(response, 404, { error: 'Not in the library.' });
					return;
				}
				const record = await readRecord(id);
				const file = await watermarkedPreview(id, record, paths);
				if (!file) {
					jsonResponse(response, 404, { error: 'No preview yet.' });
					return;
				}
				writeResponse(response, 200, await readFile(file), 'image/jpeg');
				return;
			}
			if (request.method === 'PATCH' && url.pathname.startsWith('/api/photos/')) {
				const id = decodeURIComponent(url.pathname.slice('/api/photos/'.length));
				if (!library.items.some((item) => item.id === id)) {
					jsonResponse(response, 404, { error: 'Not in the library.' });
					return;
				}
				const updated = applyPatch(await readRecord(id), await readBody(request));
				await writeJsonAtomic(recordFile(id), updated, 0o644);
				const item = library.items.find((candidate) => candidate.id === id);
				jsonResponse(
					response,
					200,
					photoEntry({
						id,
						source: item?.source,
						record: updated,
						essay: essayIndex(await readEssays()).get(id),
						token,
						// What the original was found not to carry does not change when you type.
						absent: backfilled.get(id)?.absent ?? [],
						backfillError: backfilled.get(id)?.error ?? null
					})
				);
				return;
			}
			if (request.method === 'PATCH' && url.pathname.startsWith('/api/essays/')) {
				const route = decodeURIComponent(url.pathname.slice('/api/essays/'.length));
				jsonResponse(response, 200, await updateEssay(route, await readBody(request)));
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
	server.on('error', (error) => console.error('Studio server error: ' + error.message));
	const url = `http://127.0.0.1:${options.port}/`;
	console.log('\n  Photo studio ready\n');
	console.log(`  \u279c  Local:   ${url}`);
	console.log('  \u279c  Loopback only · edits save as you type');
	console.log('  \u279c  press Ctrl+C to stop\n');
	if (options.open) await launchBrowser(url);
	const close = () => server.close(() => process.exit(0));
	process.on('SIGINT', close);
	process.on('SIGTERM', close);
}

run().catch((error) => {
	console.error('Photo studio failed: ' + error.message);
	process.exitCode = 1;
});
