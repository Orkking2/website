import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test, { type TestContext } from 'node:test';
import sharp from 'sharp';
import { readContent } from './index.ts';
import { buildFigures } from './figures.ts';

const svg =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 522 82"><rect width="522" height="82" fill="red"/></svg>';

async function fixture(t: TestContext) {
	const root = await mkdtemp(path.join(tmpdir(), 'nebve-figures-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const directory = path.join(root, 'src/content');
	await mkdir(directory, { recursive: true });
	const article = async (body: string) =>
		writeFile(
			path.join(directory, 'index.md'),
			`---\ntitle: Diagram\nsummary: A diagram.\n---\n\n${body}\n`
		);
	await writeFile(path.join(directory, 'Queue drawing.drawio.svg'), svg);
	await article('<Figure src="./Queue drawing.drawio.svg" alt="Queue" />');
	return { root, directory, article };
}

test('one tag resolves a colocated draw.io SVG, infers dimensions, and publishes intact vectors', async (t) => {
	const { root } = await fixture(t);
	const { pages } = await readContent(root);
	const catalog = await buildFigures(pages, root);
	const image = catalog.get('/')!['./Queue drawing.drawio.svg'];
	assert.equal(image.width, 522);
	assert.equal(image.height, 82);
	assert.equal(image.srcset, undefined);
	assert.equal(await readFile(path.join(root, 'static', image.src), 'utf8'), svg);
	assert.ok(!JSON.stringify(catalog.get('/')).includes(root));
});

test('source edits change URLs and remove obsolete generated files', async (t) => {
	const { root, directory, article } = await fixture(t);
	const build = async () => buildFigures((await readContent(root)).pages, root);
	const before = (await build()).get('/')!['./Queue drawing.drawio.svg'];
	await writeFile(path.join(directory, 'Queue drawing.drawio.svg'), svg.replace('red', 'blue'));
	const after = (await build()).get('/')!['./Queue drawing.drawio.svg'];
	assert.notEqual(before.src, after.src);
	assert.deepEqual(await readdir(path.join(root, 'static/images/figures')), [
		path.basename(after.src)
	]);
	await article('No figure.');
	await build();
	assert.deepEqual(await readdir(path.join(root, 'static/images/figures')), []);
});

test('raster figures have responsive transparent variants without upscaling', async (t) => {
	const { root, directory, article } = await fixture(t);
	await sharp({ create: { width: 900, height: 300, channels: 4, background: '#ff000080' } })
		.png()
		.toFile(path.join(directory, 'diagram.png'));
	await article('<Figure src="diagram.png" alt="Diagram" />');
	const image = (await buildFigures((await readContent(root)).pages, root)).get('/')![
		'diagram.png'
	];
	assert.equal(image.width, 900);
	for (const srcset of [image.srcset!, image.webpSrcset!]) {
		assert.deepEqual(
			srcset.split(', ').map((entry) => Number(entry.split(' ')[1].slice(0, -1))),
			[480, 800, 900]
		);
		for (const entry of srcset.split(', ')) {
			const metadata = await sharp(path.join(root, 'static', entry.split(' ')[0])).metadata();
			assert.equal(metadata.hasAlpha, true);
			assert.equal(metadata.exif, undefined);
			assert.ok(metadata.width <= 900);
		}
	}
});

test('validation identifies missing assets, missing alt, private masters, and escaping symlinks', async (t) => {
	const { root, directory, article } = await fixture(t);
	await article('<Figure alt="Queue" />');
	await assert.rejects(readContent(root), /Supply an image path/);
	await article('<Figure src="missing.svg" alt="Queue" />');
	await assert.rejects(readContent(root), /index.md:6.*Figure.*missing.svg.*does not exist/);
	await article('<Figure src="./Queue drawing.drawio.svg" />');
	await assert.rejects(readContent(root), /Supply alt=/);
	await mkdir(path.join(directory, '.photogrid'), { recursive: true });
	await writeFile(path.join(directory, '.photogrid/master.svg'), svg);
	await article('<Figure src=".photogrid/master.svg" alt="Queue" />');
	await assert.rejects(readContent(root), /reviewed library photographs/);
	await writeFile(path.join(root, 'outside.svg'), svg);
	await symlink(path.join(root, 'outside.svg'), path.join(directory, 'linked.svg'));
	await article('<Figure src="linked.svg" alt="Queue" />');
	await assert.rejects(readContent(root), /Expected a regular file inside/);
});

test('root-relative static assets work and documented or commented figures are ignored', async (t) => {
	const { root, article } = await fixture(t);
	await mkdir(path.join(root, 'static/images'), { recursive: true });
	await writeFile(path.join(root, 'static/images/example.svg'), svg);
	await article(
		'```svelte\n<Figure src="absent.svg" />\n```\n\n<!-- <Figure src="missing.svg" /> -->\n\n<Figure src="/images/example.svg" alt="" />'
	);
	const { pages } = await readContent(root);
	assert.deepEqual(Object.keys(pages[0].figures), ['/images/example.svg']);
	assert.equal((await buildFigures(pages, root)).get('/')!['/images/example.svg'].width, 522);
});

test('existing imported image expressions keep working', async (t) => {
	const { root, article } = await fixture(t);
	await article('<Figure src={importedImage} alt={description} />');
	assert.deepEqual((await readContent(root)).pages[0].figures, {});
});
