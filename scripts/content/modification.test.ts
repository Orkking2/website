import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { appendFile, mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { modificationTimes } from './modification.ts';
import { readContent } from './index.ts';

const execute = promisify(execFile);

test('saved article order survives a bulk commit, a newer collection index, and a shallow clone', async (t) => {
	const root = await mkdtemp(path.join(tmpdir(), 'nebve-saved-order-'));
	const clone = `${root}-clone`;
	t.after(async () => {
		await rm(root, { recursive: true, force: true });
		await rm(clone, { recursive: true, force: true });
	});
	const git = (...args: string[]) =>
		execute('git', args, {
			cwd: root,
			env: {
				...process.env,
				GIT_AUTHOR_NAME: 'Content test',
				GIT_AUTHOR_EMAIL: 'test@example.invalid',
				GIT_COMMITTER_NAME: 'Content test',
				GIT_COMMITTER_EMAIL: 'test@example.invalid',
				GIT_AUTHOR_DATE: '2030-01-01T00:00:00Z',
				GIT_COMMITTER_DATE: '2030-01-01T00:00:00Z'
			}
		});
	await git('init');
	const files = {
		'index.md': ['Home', 1_700_000_000],
		'writing/index.md': ['Writing', 1_700_000_000],
		'writing/older/index.md': ['Older', 1_900_000_000],
		'writing/older/article.md': ['Older article', 1_700_000_000],
		'writing/ubq-v8/index.md': ['V8', 1_700_000_000],
		'writing/ubq-v8/beginning.md': ['The Beginning', 1_800_000_000]
	} as const;
	for (const [relative, [title, time]] of Object.entries(files)) {
		const file = path.join(root, 'src/content', relative);
		await mkdir(path.dirname(file), { recursive: true });
		await writeFile(file, `---\ntitle: ${title}\nsummary: A summary.\n---\n\nBody.\n`);
		await utimes(file, time, time);
	}
	const assertOrder = async (directory: string) => {
		const { byRoute } = await readContent(directory);
		assert.deepEqual(byRoute.get('/writing')?.children, ['/writing/ubq-v8', '/writing/older']);
		assert.equal(byRoute.get('/writing/ubq-v8/beginning')?.modified, 1_800_000_000_000);
	};
	await assertOrder(root);
	await git('add', '.');
	await git('-c', 'commit.gpgsign=false', 'commit', '-m', 'Commit all articles together');
	await assertOrder(root);
	await git('clone', '--depth=1', `file://${root}`, clone);
	await assertOrder(clone);
	// Checkouts and touches cannot substitute their timestamps for a saved content version.
	await utimes(
		path.join(clone, 'src/content/writing/older/article.md'),
		2_000_000_000,
		2_000_000_000
	);
	await assertOrder(clone);
	// A real saved revision does update the order without requiring a commit.
	const revised = path.join(clone, 'src/content/writing/older/article.md');
	await appendFile(revised, 'A new paragraph.\n');
	await utimes(revised, 2_000_000_000, 2_000_000_000);
	assert.equal((await readContent(clone)).byRoute.get('/writing')?.children[0], '/writing/older');
});

test('Git dates survive checkouts, while staged, unstaged, and new pages use saved times', async (t) => {
	const temporary = await mkdtemp(path.join(tmpdir(), 'nebve-modification-'));
	t.after(() => rm(temporary, { recursive: true, force: true }));
	const root = path.join(temporary, 'source');
	await mkdir(path.join(root, 'src/content'), { recursive: true });
	let commitDate = '2020-01-02T00:00:00Z';
	const git = async (...args: string[]) =>
		execute('git', args, {
			cwd: root,
			env: {
				...process.env,
				GIT_AUTHOR_NAME: 'Content test',
				GIT_AUTHOR_EMAIL: 'test@example.invalid',
				GIT_COMMITTER_NAME: 'Content test',
				GIT_COMMITTER_EMAIL: 'test@example.invalid',
				GIT_AUTHOR_DATE: '2020-01-01T00:00:00Z',
				GIT_COMMITTER_DATE: commitDate
			}
		});
	await git('init');
	const file = 'src/content/a page.md';
	await writeFile(path.join(root, file), 'Original content.\n');
	// A repository before its first commit uses filesystem time.
	await utimes(path.join(root, file), 1_700_000_000, 1_700_000_000);
	assert.equal(await (await modificationTimes(root, 'src/content'))(file), 1_700_000_000_000);
	await git('add', '--', file);
	await git('-c', 'commit.gpgsign=false', 'commit', '-m', 'Add page');
	const committed = Date.parse('2020-01-02T00:00:00Z');
	assert.equal(await (await modificationTimes(root, 'src/content'))(file), committed);
	await utimes(path.join(root, file), 1_800_000_000, 1_800_000_000);
	assert.equal(await (await modificationTimes(root, 'src/content'))(file), committed);

	const clone = path.join(temporary, 'clone');
	await git('clone', '--no-local', root, clone);
	assert.equal(await (await modificationTimes(clone, 'src/content'))(file), committed);

	await appendFile(path.join(root, file), 'Saved revision.\n');
	await utimes(path.join(root, file), 1_900_000_000, 1_900_000_000);
	assert.equal(await (await modificationTimes(root, 'src/content'))(file), 1_900_000_000_000);
	await git('add', '--', file);
	assert.equal(await (await modificationTimes(root, 'src/content'))(file), 1_900_000_000_000);
	commitDate = '2020-02-01T00:00:00Z';
	await git('-c', 'commit.gpgsign=false', 'commit', '-m', 'Revise page');
	assert.equal(await (await modificationTimes(root, 'src/content'))(file), Date.parse(commitDate));

	const fresh = 'src/content/new.svx';
	await writeFile(path.join(root, fresh), 'New page.\n');
	await utimes(path.join(root, fresh), 2_000_000_000, 2_000_000_000);
	assert.equal(await (await modificationTimes(root, 'src/content'))(fresh), 2_000_000_000_000);
	// Reusing the name of a deleted page is still a new, untracked file.
	await git('rm', '--', file);
	await git('-c', 'commit.gpgsign=false', 'commit', '-m', 'Remove page');
	await writeFile(path.join(root, file), 'Replacement page.\n');
	await utimes(path.join(root, file), 2_000_000_000, 2_000_000_000);
	assert.equal(await (await modificationTimes(root, 'src/content'))(file), 2_000_000_000_000);
});
