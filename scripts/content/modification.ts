import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';

const execute = promisify(execFile);

const savedTimesSchema = z.object({
	version: z.literal(1),
	files: z.record(
		z.string(),
		z.object({ hash: z.string().regex(/^[a-f0-9]{64}$/), modified: z.number().finite() })
	)
});

/** Keep saved file times attached to their content, even after a bulk commit or clone. */
export async function modificationTimes(
	root: string,
	directory: string,
	{ captureExisting = false } = {}
) {
	const record = path.join(root, directory, '.modification-times.json');
	let source = '';
	try {
		source = await readFile(record, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
	const saved = source ? savedTimesSchema.parse(JSON.parse(source)).files : {};
	const resolved: typeof saved = {};
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
	const resolve = async (file: string): Promise<number> => {
		const absolute = path.join(root, file);
		const hash = createHash('sha256')
			.update(await readFile(absolute))
			.digest('hex');
		let modified = saved[file]?.hash === hash ? saved[file].modified : undefined;
		if (captureExisting) modified = undefined;
		if (modified === undefined && !captureExisting && tracked.has(file) && !changed.has(file)) {
			// Older content without a matching saved record still has a reproducible fallback.
			const timestamp = (await git('log', '-1', '--format=%ct', '--', file)).trim();
			if (timestamp) modified = Number(timestamp) * 1000;
		}
		modified ??= (await stat(absolute)).mtimeMs;
		resolved[file] = { hash, modified };
		return modified;
	};
	return Object.assign(resolve, {
		async save() {
			const files = Object.fromEntries(
				Object.entries(resolved).sort(([a], [b]) => a.localeCompare(b))
			);
			const output = JSON.stringify({ version: 1, files }, null, '\t') + '\n';
			if (source !== output) await writeFile(record, output);
		}
	});
}
