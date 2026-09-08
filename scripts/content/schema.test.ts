import assert from 'node:assert/strict';
import test from 'node:test';
import { findTags, stripCode, usedComponents, withComponentImports } from './components.ts';
import {
	completenessIssues,
	dealIntoColumns,
	isReady,
	parseMetadata,
	parsePhoto,
	photoIssues,
	titleOf
} from './schema.ts';

const article = {
	title: 'A title',
	summary: 'A summary.',
	published: '2026-09-04',
	tags: [],
	related: []
};

test('frontmatter is checked for shape, not for finishedness', () => {
	assert.equal(parseMetadata(article, 'f.md').title, 'A title');
	assert.throws(() => parseMetadata({ ...article, extra: 1 }, 'f.md'), /extra/);
	assert.throws(() => parseMetadata({ ...article, tags: ['a', 'a'] }, 'f.md'), /duplicate/i);
	assert.throws(() => parseMetadata({ ...article, related: ['writing/x'] }, 'f.md'), /related/);
});

test('a facet applies only once the page asks for it', () => {
	// No `published:` key at all is a page that is not dated, not an unfinished date.
	const undated = parseMetadata({ title: 'A page', summary: 'A summary.' }, 'p.md');
	assert.deepEqual(completenessIssues(undated, 'Body.'), []);
	assert.equal('published' in undated, false);
	assert.equal(undated.layout, 'page');
});

test('annotations are independent of the common default layout', () => {
	const page = parseMetadata({ ...article, annotations: true }, 'f.md');
	assert.equal(page.layout, 'page');
	assert.equal(page.annotations, true);
	for (const layout of ['index', 'article']) {
		assert.throws(() => parseMetadata({ ...article, layout }, 'f.md'), /layout/);
	}
});

test('a revision cannot predate the first publication', () => {
	assert.throws(
		() => parseMetadata({ ...article, updated: '2026-09-01' }, 'f.md'),
		/cannot precede/
	);
});

test('completeness is computed from what is missing, never declared', () => {
	assert.deepEqual(completenessIssues(parseMetadata(article, 'f.md'), 'Body.'), []);
	const bare = parseMetadata({ ...article, summary: null, published: null }, 'f.md');
	const issues = completenessIssues(bare, '   ');
	assert.equal(issues.length, 3);
	assert.ok(issues.some((issue) => issue.startsWith('summary:')));
	assert.ok(issues.some((issue) => issue.startsWith('body:')));
	assert.ok(issues.some((issue) => issue.startsWith('published:')));
});

test('an open voice flag is an unfinished item, reported with its line', () => {
	const issues = completenessIssues(
		parseMetadata(article, 'f.md'),
		'One\n\n<!-- Voice flag: say this in your own words -->\n'
	);
	assert.match(issues[0], /^body:3: Resolve the open Voice flag — say this in your own words$/);
});

const essay = {
	title: 'Worn with time',
	summary: 'A summary.',
	published: '2026-09-04',
	location: null,
	images: { tombstone: 'photo-abc123', steps: 'photo-def456' },
	cover: 'tombstone'
};

test('a page that names photographs covers itself with one of them', () => {
	assert.deepEqual(completenessIssues(parseMetadata(essay, 'e.md'), 'Body.'), []);
	const stray = parseMetadata({ ...essay, cover: 'nowhere' }, 'e.md');
	assert.match(completenessIssues(stray, 'Body.')[0], /^cover:/);
	const empty = parseMetadata({ ...essay, images: {}, cover: null }, 'e.md');
	assert.match(completenessIssues(empty, 'Body.')[0], /^images:/);
});

test('a page without its own photographs takes an image path as its cover', () => {
	assert.equal(
		parseMetadata({ ...article, cover: '/images/a.jpg' }, 'f.md').cover,
		'/images/a.jpg'
	);
	assert.throws(() => parseMetadata({ ...article, cover: 'tombstone' }, 'f.md'), /cover/);
});

test('two names may share a title but not the same photograph', () => {
	assert.throws(
		() => parseMetadata({ ...essay, images: { one: 'photo-abc123', two: 'photo-abc123' } }, 'e.md'),
		/one name on this page/
	);
});

test('a name that could be read as a number is refused, so written order is kept', () => {
	assert.throws(
		() => parseMetadata({ ...essay, images: { '1': 'photo-abc123' } }, 'e.md'),
		/starts with a letter/
	);
});

const photo = {
	schemaVersion: 1 as const,
	id: 'photo-abc123',
	asset: {
		master: '../masters/photo-abc123.jpg',
		format: 'jpeg' as const,
		width: 100,
		height: 100,
		colorSpace: 'sRGB' as const,
		orientation: 1 as const
	},
	title: null,
	caption: null,
	alt: 'A description.',
	decorative: false,
	captured: { local: '2026-07-03T19:52:06', offset: '+02:00', precision: 'second' as const },
	location: null,
	reviewed: true,
	gallery: { included: true }
};

test('a photograph needs alternative text unless it is marked decorative', () => {
	assert.deepEqual(photoIssues(parsePhoto(photo, 'p.json')), []);
	assert.match(photoIssues(parsePhoto({ ...photo, alt: null }, 'p.json'))[0], /^alt:/);
	assert.deepEqual(
		photoIssues(parsePhoto({ ...photo, alt: null, decorative: true }, 'p.json')),
		[]
	);
});

test('a photograph is unfinished until it is both reviewed and complete', () => {
	// Unfinished covers both halves of the one stage before publication.
	assert.equal(isReady(parsePhoto(photo, 'p.json')), true);
	assert.equal(isReady(parsePhoto({ ...photo, reviewed: false }, 'p.json')), false);
	assert.equal(isReady(parsePhoto({ ...photo, alt: null }, 'p.json')), false);
});

test('a record written before the review stage existed reads as unreviewed', () => {
	const older: Record<string, unknown> = { ...photo };
	delete older.reviewed;
	assert.equal(parsePhoto(older, 'p.json').reviewed, false);
});

test('a photograph carries no essay of its own, because the essay holds that list', () => {
	assert.throws(
		() => parsePhoto({ ...photo, photoEssay: '/writing/photography/x' }, 'p.json'),
		/photoEssay/
	);
});

test('a photograph without a title is served as Untitled rather than blocking', () => {
	assert.equal(titleOf(parsePhoto(photo, 'p.json')), 'Untitled');
	assert.equal(
		titleOf(parsePhoto({ ...photo, title: 'Worn with time' }, 'p.json')),
		'Worn with time'
	);
});

test('a decorative photograph cannot also carry alternative text', () => {
	assert.throws(() => parsePhoto({ ...photo, decorative: true }, 'p.json'), /decorative/);
});

test('a master path that does not match the record is refused', () => {
	assert.throws(
		() =>
			parsePhoto({ ...photo, asset: { ...photo.asset, master: '../masters/other.jpg' } }, 'p.json'),
		/asset\.master/
	);
});

test('examples inside code are never read as authored markup', () => {
	const body = ['Prose.', '', '```markdown', '<Entries from="writing" />', '```', ''].join('\n');
	assert.equal(stripCode(body).includes('<Entries'), false);
	assert.deepEqual(findTags(body, ['Entries']), []);
	assert.deepEqual(usedComponents(body), []);
	assert.equal(usedComponents('Text with `<Entry />` inline.').length, 0);
});

test('a tag is located with its attributes and its line', () => {
	const body = 'One\n\n<Entries from="writing" limit="3">\n<Entry title="Soon" />\n</Entries>\n';
	const [entries, entry] = findTags(body, ['Entries', 'Entry']);
	assert.deepEqual(entries, {
		name: 'Entries',
		attributes: { from: 'writing', limit: '3' },
		line: 3
	});
	assert.deepEqual(entry.attributes, { title: 'Soon' });
	assert.equal(entry.line, 4);
});

test('only the components a file actually uses are imported, after its own text', () => {
	const source = '---\ntitle: x\n---\n\n<Section title="Writing">\n\nProse.\n\n</Section>\n';
	const withImports = withComponentImports(source);
	assert.ok(withImports.startsWith(source), 'authored lines must keep their original positions');
	assert.match(
		withImports,
		/import Section from '\$lib\/components\/content\/catalog\/Section\.svelte';/
	);
	assert.equal(/import Entries/.test(withImports), false);
	assert.equal(
		withComponentImports('---\ntitle: x\n---\n\nPlain prose.\n'),
		'---\ntitle: x\n---\n\nPlain prose.\n'
	);
});

const landscape = { width: 4, height: 3 };
const portrait = { width: 3, height: 4 };

/** Read the gallery the way an eye does: down the page, taking whichever column is higher. */
function metInOrder(
	columns: ReturnType<typeof dealIntoColumns<{ width: number; height: number }>>
) {
	return columns
		.flatMap((column) => {
			let y = 0;
			return column.map(({ item, index }) => {
				const top = y;
				y += item.height / item.width + 0.12;
				return { index, top };
			});
		})
		.sort((a, b) => a.top - b.top || a.index - b.index)
		.map((entry) => entry.index);
}

test('every photograph is dealt exactly once, and none is lost between columns', () => {
	const items = Array.from({ length: 13 }, (unused, n) => (n % 3 ? landscape : portrait));
	const columns = dealIntoColumns(items, 2);
	assert.deepEqual(
		columns
			.flat()
			.map((entry) => entry.index)
			.toSorted((a, b) => a - b),
		items.map((unused, n) => n)
	);
});

test('a gallery of alternating orientations still reads down the page in order', () => {
	// Alternating orientations are what defeats dealing strictly left, right, left:
	// one column collects every short photograph and runs away from the other.
	const items = Array.from({ length: 40 }, (unused, n) => (n % 2 ? portrait : landscape));
	const met = metInOrder(dealIntoColumns(items, 2));
	const displacement = Math.max(...met.map((index, position) => Math.abs(index - position)));
	assert.equal(displacement, 0, 'photographs should be met in the order they were taken');
});

test('the columns do not drift further apart as the gallery grows', () => {
	// The property that matters: a mismatch stays local instead of accumulating. Always
	// choosing the shortest column holds the two within one photograph's height of each
	// other, however many are added — so a long gallery reads no worse than a short one.
	const gap = (length: number) => {
		const items = Array.from({ length }, (unused, n) => (n % 2 ? portrait : landscape));
		const heights = dealIntoColumns(items, 2).map((column) =>
			column.reduce((total, { item }) => total + item.height / item.width + 0.12, 0)
		);
		return Math.abs(heights[0] - heights[1]);
	};
	const tallest = portrait.height / portrait.width + 0.12;
	for (const length of [10, 40, 200, 1000])
		assert.ok(
			gap(length) <= tallest,
			`${length} photographs left the columns ${gap(length).toFixed(2)} apart, more than the tallest photograph`
		);
});

test('dealing a single column keeps the sequence exactly as it was taken', () => {
	const items = Array.from({ length: 6 }, (unused, n) => (n % 2 ? portrait : landscape));
	const [only] = dealIntoColumns(items, 1);
	assert.deepEqual(
		only.map((entry) => entry.index),
		[0, 1, 2, 3, 4, 5]
	);
});
