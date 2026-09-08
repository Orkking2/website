import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stringify } from 'yaml';
import { compile as markdown } from 'mdsvex';
import { compile as svelte } from 'svelte/compiler';
import { withComponentImports } from './components.ts';
import { contentDirectory, indexName, projectRoot, readContent, routeOf } from './index.ts';
import { dateSchema, findVoiceFlags, isReady, routeSchema } from './schema.ts';

/**
 * Start a page at a path.
 *
 * The path is the whole declaration: "/writing/some-idea" writes
 * src/content/writing/some-idea.md, and "/notes" writes src/content/notes.md.
 * Pass --directory to open it as src/content/notes/index.md instead, so the page
 * can hold children.
 */
export async function scaffold(
	route: string,
	title: string,
	{ directory = false, root = projectRoot } = {}
) {
	routeSchema.parse(route);
	if (route === '/') throw new Error('The site root already exists as src/content/index.md.');
	if (!title?.trim()) throw new Error('Supply the draft title with --title.');
	const segments = route.slice(1).split('/');
	const parent = routeOf(segments.slice(0, -1));
	const { byRoute } = await readContent(root, { strict: false });
	const holder = byRoute.get(parent);
	if (!holder) throw new Error(`Nothing is served at "${parent}", so it cannot hold a page.`);
	if (byRoute.has(route)) throw new Error(`A page is already served at "${route}".`);
	const folder = path.join(
		root,
		contentDirectory,
		...(directory ? segments : segments.slice(0, -1))
	);
	await mkdir(folder, { recursive: true });
	const file = path.join(folder, `${directory ? indexName : segments.at(-1)}.md`);
	const metadata = { title, summary: null };
	const body = directory ? `<Entries from="${route}" />\n` : '';
	await writeFile(file, `---\n${stringify(metadata)}---\n\n${body}`, { flag: 'wx' });
	return file;
}

export async function validateContent() {
	const content = await readContent();
	const voiceFlags: Array<{ file: string; line: number; reason: string }> = [];
	for (const page of content.pages) {
		const source = await readFile(path.join(projectRoot, page.file), 'utf8');
		// Compile exactly what the build compiles, imports included.
		const compiled = await markdown(withComponentImports(source), {
			filename: page.file,
			extensions: ['.md', '.svx'],
			highlight: false
		});
		if (!compiled) throw new Error(`${page.file}: Markdown compilation returned no result.`);
		const result = svelte(compiled.code, { filename: page.file, generate: 'server', runes: true });
		const warnings = result.warnings.filter((warning) => warning.code.startsWith('a11y'));
		if (warnings.length)
			throw new Error(`${page.file}: ${warnings.map((warning) => warning.message).join('\n')}`);
		for (const flag of findVoiceFlags(source)) voiceFlags.push({ file: page.file, ...flag });
	}
	if (voiceFlags.length) {
		console.log(`${voiceFlags.length} open voice flag(s) to review in your own words:`);
		for (const flag of voiceFlags) console.log(`  ${flag.file}:${flag.line} — ${flag.reason}`);
	}
	const ready = content.photos.filter(isReady).length;
	console.log(
		`Validated ${content.pages.length} pages and ${content.photos.length} photographs ` +
			`(${ready} reviewed and complete, ${content.photos.length - ready} unfinished and not published).`
	);
}

async function run() {
	const [command, route, ...options] = process.argv.slice(2);
	if (command === 'check') return validateContent();
	if (command === 'new') {
		const directory = options.includes('--directory');
		const flag = options.indexOf('--title');
		if (flag === -1 || !options[flag + 1])
			throw new Error(
				'Usage: npm run content:new -- /writing/some-idea --title "Some title" [--directory]'
			);
		console.log(
			`Created local draft: ${path.relative(projectRoot, await scaffold(route, options[flag + 1], { directory }))}`
		);
		return;
	}
	if (command === 'revision') {
		if (options.length !== 2 || options[0] !== '--date')
			throw new Error('Usage: npm run content:revision -- /writing/some-idea --date YYYY-MM-DD');
		dateSchema.parse(options[1]);
		const page = (await readContent()).byRoute.get(route);
		if (!page?.metadata.published)
			throw new Error('Choose a page with an existing first-publication date.');
		if (options[1] < page.metadata.published)
			throw new Error('A revision date cannot precede first publication.');
		console.log(
			`${page.file}\nKeep published: ${page.metadata.published}\n${page.metadata.updated ? `Current updated: ${page.metadata.updated}\n` : ''}If this is a substantive revision, set updated: ${options[1]} in frontmatter. No dates were changed.`
		);
		return;
	}
	throw new Error('Choose check, new, or revision.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
	run().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
