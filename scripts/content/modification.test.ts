import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { appendFile, mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { modificationTimes } from './modification.ts';

const execute = promisify(execFile);

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
