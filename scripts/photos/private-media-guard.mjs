import { execFileSync } from 'node:child_process';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { PROJECT_ROOT, RAW_EXTENSIONS, pathExists } from './lib/core.mjs';

const PRIVATE_PATH_MARKERS = [
	Buffer.from('.local/photography'),
	Buffer.from('.local\\photography'),
	Buffer.from('manifest.private.json'),
	Buffer.from('"sourceRoots"'),
	Buffer.from('"sourceRelativePaths"')
];

function parseArguments(arguments_) {
	const options = { sourceOnly: false, output: null };
	for (let index = 0; index < arguments_.length; index += 1) {
		const argument = arguments_[index];
		if (argument === '--source-only') {
			options.sourceOnly = true;
			continue;
		}
		if (argument === '--output') {
			options.output = arguments_[++index];
			if (!options.output) throw new Error('--output requires a directory.');
			continue;
		}
		if (argument === '--help' || argument === '-h') {
			console.log(
				'Usage: node scripts/photos/private-media-guard.mjs [--source-only] [--output <directory>]'
			);
			process.exit(0);
		}
		throw new Error('Unknown option: ' + argument);
	}
	return options;
}

function forbiddenMediaExtension(candidate) {
	const extension = path.extname(candidate).toLowerCase();
	return extension === '.heic' || extension === '.heif' || RAW_EXTENSIONS.has(extension);
}

function repositoryCandidates() {
	const output = execFileSync(
		'git',
		['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
		{ cwd: PROJECT_ROOT, encoding: 'buffer' }
	);
	return output.toString('utf8').split('\0').filter(Boolean);
}

async function scanPublicDirectory(directory, label, failures) {
	if (!(await pathExists(directory))) return;
	const privateRoot = path.join(PROJECT_ROOT, '.local', 'photography');

	async function visit(candidate) {
		const stats = await lstat(candidate);
		const relative = path.relative(directory, candidate).split(path.sep).join('/');
		const segments = relative.split('/');

		if (stats.isSymbolicLink()) {
			const target = await realpath(candidate);
			const relation = path.relative(privateRoot, target);
			if (!relation.startsWith('..') && !path.isAbsolute(relation)) {
				failures.push(label + '/' + relative + ': symbolic link points into private intake data.');
			}
			return;
		}
		if (stats.isDirectory()) {
			const entries = await readdir(candidate);
			for (const entry of entries) await visit(path.join(candidate, entry));
			return;
		}
		if (!stats.isFile()) return;

		if (
			forbiddenMediaExtension(relative) ||
			segments.includes('.local') ||
			segments.includes('originals') ||
			path.basename(relative) === 'manifest.private.json'
		) {
			failures.push(
				label + '/' + relative + ': private/original media is forbidden in public output.'
			);
		}

		const body = await readFile(candidate);
		for (const marker of PRIVATE_PATH_MARKERS) {
			if (body.includes(marker)) {
				failures.push(
					label +
						'/' +
						relative +
						': contains private photography path or provenance marker ' +
						JSON.stringify(marker.toString('utf8')) +
						'.'
				);
			}
		}
	}

	await visit(directory);
}

async function run() {
	const options = parseArguments(process.argv.slice(2));
	const failures = [];
	for (const candidate of repositoryCandidates()) {
		const normalized = candidate.split(path.sep).join('/');
		if (normalized.startsWith('.local/')) {
			failures.push(candidate + ': private intake path is not ignored by Git.');
		}
		if (forbiddenMediaExtension(normalized)) {
			failures.push(
				candidate + ': original HEIC/HEIF/RAW media must remain in the ignored intake area.'
			);
		}
	}

	await scanPublicDirectory(path.join(PROJECT_ROOT, 'static'), 'static', failures);
	await scanPublicDirectory(
		path.join(PROJECT_ROOT, 'src', 'content', 'photography'),
		'src/content/photography',
		failures
	);
	if (!options.sourceOnly && options.output) {
		const outputDirectory = path.resolve(PROJECT_ROOT, options.output);
		const relation = path.relative(PROJECT_ROOT, outputDirectory);
		if (relation.startsWith('..') || path.isAbsolute(relation)) {
			throw new Error('Public output guard only scans directories inside the project.');
		}
		await scanPublicDirectory(outputDirectory, options.output, failures);
	}

	if (failures.length > 0) {
		throw new Error(
			'Private photography guard found ' +
				failures.length +
				' problem(s):\n- ' +
				failures.join('\n- ')
		);
	}
	console.log(
		'Private photography guard passed for repository inputs' +
			(options.sourceOnly
				? ' and static/.'
				: options.output
					? ', static/, and ' + options.output + '/.'
					: '.')
	);
}

run().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
