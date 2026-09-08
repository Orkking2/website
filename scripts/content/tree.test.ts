import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readContent } from './index.ts';

/** Build a content tree from a map of relative paths to frontmatter. */
async function tree(files: Record<string, Record<string, unknown>>) {
	const root = await mkdtemp(path.join(tmpdir(), 'nebve-tree-'));
	for (const [relative, metadata] of Object.entries(files)) {
		const file = path.join(root, 'src/content', relative);
		await mkdir(path.dirname(file), { recursive: true });
		const frontmatter = Object.entries({ summary: 'A summary.', ...metadata })
			.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
			.join('\n');
		await writeFile(file, `---\n${frontmatter}\n---\n\nBody.\n`);
	}
	return root;
}

const home = { title: 'Home' };

test('the tree is the site: a file is a page and a directory serves its index', async () => {
	const root = await tree({
		'index.md': home,
		'about.md': { title: 'About' },
		'writing/index.md': { title: 'Writing' },
		'writing/an-article.md': { title: 'An article' },
		'writing/deep/index.md': { title: 'Deep' },
		'writing/deep/deeper.md': { title: 'Deeper' }
	});
	const { pages, byRoute } = await readContent(root);
	assert.deepEqual(pages.map((page) => page.route).toSorted(), [
		'/',
		'/about',
		'/writing',
		'/writing/an-article',
		'/writing/deep',
		'/writing/deep/deeper'
	]);
	// index.md is the directory's own page, so it may hold children; a plain file may not.
	assert.equal(byRoute.get('/writing')?.directory, true);
	assert.equal(byRoute.get('/about')?.directory, false);
	assert.deepEqual(byRoute.get('/writing')?.children, ['/writing/an-article', '/writing/deep']);
	assert.equal(byRoute.get('/writing/deep/deeper')?.parent, '/writing/deep');
	assert.equal(byRoute.get('/')?.parent, null);
});

test('a directory without an index has no page of its own, and is refused', async () => {
	const root = await tree({ 'index.md': home, 'writing/an-article.md': { title: 'An article' } });
	await assert.rejects(() => readContent(root), /index\.md/);
});

test('a file and a directory cannot claim the same path', async () => {
	const root = await tree({
		'index.md': home,
		'writing.md': { title: 'Writing' },
		'writing/index.md': { title: 'Writing' }
	});
	await assert.rejects(() => readContent(root), /already this page's/);
});

test('a hidden directory is not part of the page tree', async () => {
	const root = await tree({
		'index.md': home,
		'photography/index.md': { title: 'Photography' },
		'photography/.photogrid/notes.md': { title: 'Never served' },
		'photography/_drafts/idea.md': { title: 'Never served' }
	});
	const { pages } = await readContent(root);
	assert.deepEqual(pages.map((page) => page.route).toSorted(), ['/', '/photography']);
});

test('siblings are ordered by what they declare, then by title', async () => {
	const root = await tree({
		'index.md': home,
		'cv.md': { title: 'CV', order: 5 },
		'about.md': { title: 'About Me', order: 1 },
		'writing.md': { title: 'Writing', order: 3 },
		'unranked.md': { title: 'Unranked' }
	});
	const { byRoute } = await readContent(root);
	assert.deepEqual(byRoute.get('/')?.children, ['/about', '/writing', '/cv', '/unranked']);
});

test('a page names another by its path, and an unknown path is refused', async () => {
	const known = {
		'index.md': home,
		'projects/index.md': { title: 'Projects' },
		'projects/ubq.md': { title: 'UBQ' }
	};
	const named = await tree({
		...known,
		'about.md': { title: 'About', related: ['/projects/ubq'] }
	});
	await readContent(named);
	const stray = await tree({
		...known,
		'about.md': { title: 'About', related: ['/projects/nope'] }
	});
	await assert.rejects(() => readContent(stray), /is not a page/);
});

test('an embed and a link are checked against the page tree', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'nebve-tree-'));
	const write = async (relative: string, body: string) => {
		const file = path.join(root, 'src/content', relative);
		await mkdir(path.dirname(file), { recursive: true });
		await writeFile(file, `---\ntitle: "A page"\nsummary: "A summary."\n---\n\n${body}\n`);
	};
	await write('index.md', '<Link to="/writing">Writing</Link>');
	await write('writing/index.md', '<Entries from="/writing" />');
	await write('writing/an-article.md', 'Body.');
	await readContent(root);

	await write('index.md', '<Link to="/nowhere">Nowhere</Link>');
	await assert.rejects(() => readContent(root), /not a route on this site/);

	await write('index.md', '<Entries from="/writing/an-article" />');
	await assert.rejects(() => readContent(root), /lists the children of a directory page/);
});
