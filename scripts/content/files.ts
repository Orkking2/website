import { access, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

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

export async function fileExists(file: string) {
	try {
		await access(file);
		return true;
	} catch {
		return false;
	}
}
