import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);

/** Resolve saved edits from disk, but keep committed dates stable across checkouts. */
export async function modificationTimes(root: string, directory: string) {
	const git = async (...args: string[]) =>
		(await execute('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })).stdout;
	let committed = false;
	try {
		await git('rev-parse', '--verify', 'HEAD');
		committed = true;
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		// Source archives and a new repository have no commit history.
		if (code !== 'ENOENT' && Number(code) !== 128) throw error;
	}
	const changed = new Set(
		committed
			? (await git('diff', '--name-only', '--no-renames', '-z', 'HEAD', '--', directory))
					.split('\0')
					.filter(Boolean)
			: []
	);
	const tracked = new Set(
		committed ? (await git('ls-files', '-z', '--', directory)).split('\0').filter(Boolean) : []
	);
	return async (file: string): Promise<number> => {
		if (tracked.has(file) && !changed.has(file)) {
			const timestamp = (await git('log', '-1', '--format=%ct', '--', file)).trim();
			if (timestamp) return Number(timestamp) * 1000;
		}
		return (await stat(path.join(root, file))).mtimeMs;
	};
}
