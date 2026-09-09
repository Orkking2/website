import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { findTags } from './components.ts';
import type { PageNode } from './index.ts';
import { assertContainedFile, fileExists } from './files.ts';
import { inspectImage, variantWidths } from '../photos/image.ts';
import type { FigureImage } from './schema.ts';

export interface FigureSource {
	file: string;
	width: number;
	height: number;
	format: string;
}

/** Resolve authored figure paths at build time, just as essay photographs are resolved. */
export async function readFigures(
	root: string,
	page: Pick<PageNode, 'file' | 'body' | 'bodyOffset'>
) {
	const figures: Record<string, FigureSource> = {};
	for (const tag of findTags(
		page.body.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' ')),
		['Figure']
	)) {
		const where = `${page.file}:${page.bodyOffset + tag.line} → <Figure>`;
		const src = tag.attributes.src;
		// Imported expressions and external URLs retain the original Figure API.
		if (src === undefined && tag.expressions.includes('src')) continue;
		if (src === undefined) throw new Error(`${where}: Supply an image path with src="…".`);
		if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) continue;
		if (!('alt' in tag.attributes) && !tag.expressions.includes('alt'))
			throw new Error(`${where}: Supply alt="…", or alt="" for a decorative figure.`);
		if (!src.trim()) throw new Error(`${where}: Supply an image path with src="…".`);
		if (figures[src]) continue;
		try {
			const base = path.join(root, src.startsWith('/') ? 'static' : 'src/content');
			const file = src.startsWith('/')
				? path.resolve(base, `.${src}`)
				: path.resolve(root, path.dirname(page.file), src);
			await assertContainedFile(base, file);
			const relative = path.relative(await realpath(base), await realpath(file));
			if (relative.split(path.sep).includes('.photogrid'))
				throw new Error('Place reviewed library photographs with <Photo of="…" />.');
			if (!/\.(svg|png|jpe?g|webp)$/i.test(file))
				throw new Error('Use SVG, PNG, JPEG, or WebP for a local figure.');
			const metadata = await inspectImage(file);
			if (!['svg', 'png', 'jpeg', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1)
				throw new Error('Use a single SVG, PNG, JPEG, or WebP image.');
			figures[src] = {
				file,
				width: metadata.width,
				height: metadata.height,
				format: metadata.format
			};
		} catch (error) {
			throw new Error(`${where} src="${src}": ${error instanceof Error ? error.message : error}`, {
				cause: error
			});
		}
	}
	return figures;
}

/** Keep SVG vectors intact; raster diagrams get responsive, lossless, transparent variants. */
export async function buildFigures(pages: PageNode[], root: string) {
	const directory = path.join(root, 'static/images/figures');
	await mkdir(directory, { recursive: true });
	const expected = new Set<string>();
	const built = new Map<string, FigureImage>();
	const result = new Map<string, Record<string, FigureImage>>();
	const emit = async (name: string, pixels: () => Promise<Buffer>) => {
		expected.add(name);
		const target = path.join(directory, name);
		if (!(await fileExists(target))) {
			await writeFile(`${target}.tmp`, await pixels());
			await rename(`${target}.tmp`, target);
		}
		return `/images/figures/${name}`;
	};
	for (const page of pages) {
		const figures: Record<string, FigureImage> = {};
		for (const [src, source] of Object.entries(page.figures)) {
			if (built.has(source.file)) {
				figures[src] = built.get(source.file)!;
				continue;
			}
			const buffer = await readFile(source.file);
			const widths = variantWidths(source.width);
			const hash = createHash('sha256')
				.update(buffer)
				.update(JSON.stringify({ widths, version: 1 }))
				.digest('hex')
				.slice(0, 16);
			let image: FigureImage;
			if (source.format === 'svg') {
				image = {
					src: await emit(`${hash}.svg`, async () => buffer),
					width: source.width,
					height: source.height
				};
			} else {
				const formats = { png: [] as string[], webp: [] as string[] };
				for (const format of ['png', 'webp'] as const) {
					for (const width of widths) {
						const url = await emit(`${hash}-${width}.${format}`, () => {
							const resized = sharp(buffer)
								.resize({ width, withoutEnlargement: true })
								.toColourspace('srgb');
							return (
								format === 'png' ? resized.png() : resized.webp({ lossless: true })
							).toBuffer();
						});
						formats[format].push(`${url} ${width}w`);
					}
				}
				image = {
					src: formats.png[Math.min(1, formats.png.length - 1)].split(' ')[0],
					srcset: formats.png.join(', '),
					webpSrcset: formats.webp.join(', '),
					width: source.width,
					height: source.height
				};
			}
			built.set(source.file, image);
			figures[src] = image;
		}
		result.set(page.route, figures);
	}
	// Like the photograph output directory, this directory is owned by the build.
	for (const name of await readdir(directory))
		if (!expected.has(name)) await rm(path.join(directory, name), { force: true });
	return result;
}
