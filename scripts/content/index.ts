import { access, readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { embeddingComponents, findTags } from './components.ts';
import {
	completenessIssues,
	isEssay,
	isReady,
	parseMetadata,
	parsePhoto,
	photoIssues,
	type PageMetadata,
	type PhotoRecord
} from './schema.ts';

export const projectRoot = path.resolve(import.meta.dirname, '../..');
export const contentDirectory = 'src/content';
/** The file that gives a directory its own page, as index.html does for a directory of a site. */
export const indexName = 'index';
/** Where the photograph library lives, hidden from the page tree by its leading dot. */
export const photoLibrary = 'src/content/photography/.photogrid';

/**
 * One authored page.
 *
 * The tree under src/content is the site: a file is a page, a directory is a page
 * with children, and index.md is what a directory serves at its own path. Nothing
 * declares where it belongs — position is the declaration.
 */
export interface PageNode {
	route: string;
	parent: string | null;
	name: string;
	depth: number;
	directory: boolean;
	children: string[];
	file: string;
	body: string;
	/** Lines the frontmatter occupies, so a body position can be reported against the file. */
	bodyOffset: number;
	metadata: PageMetadata;
}

const authored = /\.(md|svx)$/;
/** A name the page tree does not walk into: the photograph library, editor scratch, dotfiles. */
const hidden = (name: string) => name.startsWith('.') || name.startsWith('_');

export function readFrontmatter(source: string, file: string) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
	if (!match) throw new Error(`${file} → frontmatter: Start the file with YAML between --- lines.`);
	const document = parseDocument(match[1], { uniqueKeys: true });
	if (document.errors.length)
		throw new Error(
			`${file} → frontmatter: ${document.errors.map((error) => error.message).join('; ')}`
		);
	return {
		metadata: document.toJS({ maxAliasCount: 0 }),
		body: source.slice(match[0].length),
		bodyOffset: match[0].split('\n').length - 1
	};
}

export async function assertContainedFile(root: string, filename: string) {
	let actual: string;
	try {
		actual = await realpath(filename);
	} catch {
		throw new Error(`${filename}: Referenced file does not exist.`);
	}
	const relative = path.relative(await realpath(root), actual);
	if (relative.startsWith('..') || path.isAbsolute(relative) || !(await stat(actual)).isFile()) {
		throw new Error(`${filename}: Expected a regular file inside ${root}.`);
	}
}

/** The path a file at these segments is served at. */
export function routeOf(segments: string[]) {
	return segments.length ? `/${segments.join('/')}` : '/';
}

/**
 * Walk one directory of the tree, in the order a reader would meet it: the
 * directory's own index first, then its children.
 */
async function walk(root: string, segments: string[], pages: PageNode[]) {
	const directory = path.join(root, contentDirectory, ...segments);
	const listed = (await readdir(directory, { withFileTypes: true }))
		.filter((entry) => !hidden(entry.name))
		.sort((a, b) => a.name.localeCompare(b.name));
	const here = routeOf(segments);
	const files = listed.filter((entry) => entry.isFile() && authored.test(entry.name));
	const directories = listed.filter((entry) => entry.isDirectory());

	const index = files.find((entry) => path.parse(entry.name).name === indexName);
	if (!index)
		throw new Error(
			`${contentDirectory}${segments.length ? `/${segments.join('/')}` : ''}: A directory is a page, so give it an ${indexName}.md.`
		);

	const claimed = new Map<string, string>();
	const readPage = async (filename: string, pageSegments: string[], isIndex: boolean) => {
		const file = [contentDirectory, ...segments, filename].join('/');
		await assertContainedFile(directory, path.join(directory, filename));
		const {
			metadata: raw,
			body,
			bodyOffset
		} = readFrontmatter(await readFile(path.join(root, file), 'utf8'), file);
		const route = routeOf(pageSegments);
		pages.push({
			route,
			parent: isIndex ? (segments.length ? routeOf(segments.slice(0, -1)) : null) : here,
			name: pageSegments.at(-1) ?? '',
			depth: pageSegments.length,
			directory: isIndex,
			children: [],
			file,
			body,
			bodyOffset,
			metadata: parseMetadata(raw, file)
		});
	};

	await readPage(index.name, segments, true);
	for (const entry of files) {
		const name = path.parse(entry.name).name;
		if (name === indexName) continue;
		const previous = claimed.get(name);
		if (previous)
			throw new Error(
				`${contentDirectory}/${[...segments, entry.name].join('/')}: "${name}" is already this page's ${previous}.`
			);
		claimed.set(name, entry.name);
		await readPage(entry.name, [...segments, name], false);
	}
	for (const entry of directories) {
		const previous = claimed.get(entry.name);
		if (previous)
			throw new Error(
				`${contentDirectory}/${[...segments, entry.name].join('/')}/: "${entry.name}" is already this page's ${previous}.`
			);
		claimed.set(entry.name, `${entry.name}/`);
		await walk(root, [...segments, entry.name], pages);
	}
}

/** Siblings in the order the site shows them: declared order first, then title. */
export function comparePages(a: PageNode, b: PageNode) {
	const order = [
		a.metadata.order ?? Number.MAX_SAFE_INTEGER,
		b.metadata.order ?? Number.MAX_SAFE_INTEGER
	];
	if (order[0] !== order[1]) return order[0] - order[1];
	return a.metadata.title.localeCompare(b.metadata.title);
}

export async function readContent(root = projectRoot, { strict = true } = {}) {
	const incomplete: string[] = [];
	const pages: PageNode[] = [];
	await walk(root, [], pages);

	const byRoute = new Map(pages.map((page) => [page.route, page]));
	for (const page of pages) {
		if (!page.parent) continue;
		byRoute.get(page.parent)?.children.push(page.route);
	}
	for (const page of pages)
		page.children.sort((a, b) => comparePages(byRoute.get(a)!, byRoute.get(b)!));

	const recordsDirectory = path.join(root, photoLibrary, 'records');
	const mastersDirectory = path.join(root, photoLibrary, 'masters');
	const photos: PhotoRecord[] = [];
	for (const filename of (await readdir(recordsDirectory).catch(() => []))
		.filter((name) => name.endsWith('.json'))
		.sort()) {
		const file = `${photoLibrary}/records/${filename}`;
		await assertContainedFile(recordsDirectory, path.join(root, file));
		const photo = parsePhoto(JSON.parse(await readFile(path.join(root, file), 'utf8')), file);
		if (`${photo.id}.json` !== filename)
			throw new Error(`${file} → id: The filename must match the stable photo ID.`);
		// A ready photograph is served, so its master must be present to build from. An unfinished
		// one is skipped by the build, and its master may still be local-only; requiring the file
		// here would refuse the whole build for work in progress. The path itself is pinned to
		// ../masters/<id>.<format> by the schema, so nothing is left unchecked by deferring this.
		if (isReady(photo))
			await assertContainedFile(
				mastersDirectory,
				path.resolve(recordsDirectory, photo.asset.master)
			);
		photos.push(photo);
	}

	const photoIds = new Map(photos.map((photo) => [photo.id, photo]));
	for (const { metadata, file } of pages) {
		for (const route of metadata.related) {
			if (!byRoute.has(route)) throw new Error(`${file} → related: "${route}" is not a page.`);
		}
		if (isEssay(metadata))
			for (const [alias, id] of Object.entries(metadata.images)) {
				if (!photoIds.has(id))
					throw new Error(`${file} → images.${alias}: Unknown photo ID "${id}".`);
			}
		if (metadata.cover?.startsWith('/images/')) {
			await assertContainedFile(
				path.join(root, 'static'),
				path.join(root, 'static', metadata.cover)
			);
		}
	}

	for (const { metadata, file, body, bodyOffset } of pages) {
		for (const issue of completenessIssues(metadata, body)) incomplete.push(`${file} → ${issue}`);
		for (const tag of findTags(body, embeddingComponents)) {
			const where = `${file}:${bodyOffset + tag.line} → <${tag.name}>`;
			const reference = tag.attributes.from;
			if (!reference) {
				// A row written as title="..." is an authored working topic, not an embed.
				if (tag.name === 'Entry' && tag.attributes.title) continue;
				throw new Error(`${where}: Name what to embed with from="/path".`);
			}
			const target = byRoute.get(reference);
			if (!target) throw new Error(`${where}: "${reference}" is not a page on this site.`);
			if (tag.name === 'Entries' && !target.directory)
				throw new Error(
					`${where}: "${reference}" is a single page; <Entries> lists the children of a directory page.`
				);
		}
		for (const tag of findTags(body, ['Photo'])) {
			const where = `${file}:${bodyOffset + tag.line} → <Photo>`;
			const alias = tag.attributes.of;
			if (!alias) throw new Error(`${where}: Name the photograph with of="name".`);
			if (!isEssay(metadata))
				throw new Error(`${where}: Only a page that names its own photographs can place one.`);
			if (!(alias in metadata.images))
				throw new Error(
					`${where}: "${alias}" is not one of this page's photographs. Named here: ${
						Object.keys(metadata.images).join(', ') || 'none yet'
					}.`
				);
		}
		for (const tag of findTags(body, ['Count'])) {
			const where = `${file}:${bodyOffset + tag.line} → <Count>`;
			const source = tag.attributes.of;
			if (!source)
				throw new Error(`${where}: Name what to count with of="photographs" or of="/path".`);
			if (source.startsWith('/') && !byRoute.get(source)?.directory)
				throw new Error(`${where}: "${source}" is not a page with children to count.`);
		}
		for (const tag of findTags(body, ['Link'])) {
			const where = `${file}:${bodyOffset + tag.line} → <Link>`;
			const to = tag.attributes.to;
			if (!to) throw new Error(`${where}: Give the destination as to="/path".`);
			// An external destination is reviewed like any other outbound link, not against the route model.
			if (/^[a-z][a-z0-9+.-]*:/i.test(to) || to.startsWith('//')) continue;
			if (!to.startsWith('/'))
				throw new Error(`${where}: Use a site path beginning with "/", not "${to}".`);
			const destination = to.split(/[?#]/)[0].replace(/\/$/, '') || '/';
			if (!byRoute.has(destination))
				throw new Error(`${where}: "${to}" is not a route on this site.`);
		}
	}

	// Which essay a photograph belongs to is derived here, by inverting the images map each
	// essay already has to carry for its body to name a photograph. The record does not store
	// the other direction, so there is one place to change it and nothing to keep in step.
	const photoEssays = new Map<string, string>();
	for (const { metadata, file, route } of pages) {
		if (!isEssay(metadata)) continue;
		for (const [alias, id] of Object.entries(metadata.images)) {
			const claimed = photoEssays.get(id);
			if (claimed)
				throw new Error(
					`${file} → images.${alias}: "${id}" already belongs to ${claimed}. A photograph has one essay.`
				);
			photoEssays.set(id, route);
			const photo = photoIds.get(id);
			// A page that names an unfinished photograph would render a gap where an image belongs.
			if (photo && !isReady(photo))
				incomplete.push(
					`${file} → images.${alias}: "${id}" is unfinished, so it cannot be served. ${
						photo.reviewed ? photoIssues(photo).join(' ') : 'Mark it reviewed in npm run photos.'
					}`
				);
		}
	}

	// An unfinished photograph is left out of the site rather than failing the build: a library
	// is expected to hold work in progress. Calling one reviewed while its data is still
	// incomplete is the one thing worth reporting, because that claim is not true.
	for (const photo of photos)
		if (photo.reviewed)
			for (const issue of photoIssues(photo))
				incomplete.push(`${photoLibrary}/records/${photo.id}.json → ${issue}`);

	if (incomplete.length) {
		const report = `${incomplete.length} unfinished item(s):\n  ${incomplete.join('\n  ')}`;
		// Unfinished work is normal while writing and unacceptable in a build.
		if (strict) throw new Error(report);
		console.warn(report);
	}
	return { pages, byRoute, photos, photoEssays, incomplete };
}

export async function fileExists(file: string) {
	try {
		await access(file);
		return true;
	} catch {
		return false;
	}
}
