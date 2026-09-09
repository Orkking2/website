import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { inspectImage, variantSettings, variantWidths } from './image.ts';
export { inspectImage, variantSettings } from './image.ts';
import { fileExists, projectRoot } from '../content/index.ts';
import {
	captureSortValue,
	isReady,
	titleOf,
	type GalleryImage,
	type PhotoRecord
} from '../content/schema.ts';
import { watermarkOverlay, watermarkSettings } from './watermark.ts';
import { isLosslessWebp } from './lib/master.mjs';

export const downloadSettings = { lossless: true, effort: 4, version: 1 };

/** Composite at full resolution, with no lossy intermediate or final encoding. */
export function fullResolutionDownload(buffer: Buffer, photo: PhotoRecord) {
	return sharp(buffer)
		.toColourspace('srgb')
		.composite([
			{
				input: watermarkOverlay(
					{ title: titleOf(photo), captured: photo.captured, coordinates: photo.coordinates },
					photo.asset.width,
					photo.asset.height
				),
				top: 0,
				left: 0
			}
		])
		.webp({ lossless: true, effort: downloadSettings.effort })
		.withIccProfile('srgb')
		.toBuffer();
}

/**
 * Build every served size of every photograph that is finished.
 *
 * An unfinished photograph is skipped rather than refused: the library holds work
 * in progress, and nothing about it should reach the site until it is reviewed.
 * Which essay a photograph belongs to is passed in, derived from the essays
 * themselves, because the record does not store that direction.
 */
export async function buildVariants(
	records: PhotoRecord[],
	root = projectRoot,
	photoEssays: Map<string, string> = new Map()
) {
	const outputDirectory = path.join(root, 'static/images/photography');
	await mkdir(outputDirectory, { recursive: true });
	const expectedFiles = new Set<string>();
	const images: GalleryImage[] = [];
	for (const photo of records.filter(isReady)) {
		const master = path.resolve(
			root,
			'src/content/photography/.photogrid/records',
			photo.asset.master
		);
		await inspectImage(master, photo.asset);
		const buffer = await readFile(master);
		if (photo.asset.format === 'webp' && !isLosslessWebp(buffer))
			throw new Error(`${photo.id}: The full-resolution master must be lossless WebP.`);
		// The mark is part of what a served file is, so its settings and text belong in the cache key.
		const mark = {
			title: titleOf(photo),
			captured: photo.captured,
			coordinates: photo.coordinates
		};
		const hash = createHash('sha256')
			.update(buffer)
			.update(JSON.stringify(variantSettings))
			.update(JSON.stringify(watermarkSettings))
			.update(JSON.stringify(mark))
			.digest('hex')
			.slice(0, 12);
		let download: GalleryImage['download'];
		if (photo.asset.format === 'webp') {
			const downloadHash = createHash('sha256')
				.update(buffer)
				.update(JSON.stringify(downloadSettings))
				.update(JSON.stringify(watermarkSettings))
				.update(JSON.stringify(mark))
				.digest('hex')
				.slice(0, 12);
			const filename = `${photo.id}.${downloadHash}-full.webp`;
			const target = path.join(outputDirectory, filename);
			expectedFiles.add(filename);
			if (!(await fileExists(target))) {
				const pixels = await fullResolutionDownload(buffer, photo);
				await writeFile(`${target}.tmp`, pixels);
				await rename(`${target}.tmp`, target);
			}
			await inspectImage(target, photo.asset);
			const bytes = (await stat(target)).size;
			if (bytes > 25 * 1024 * 1024)
				throw new Error(
					`${photo.id}: Lossless download exceeds the 25 MiB static-asset limit. Keep the full-resolution source and review a different delivery option.`
				);
			download = {
				src: `/images/photography/${filename}`,
				bytes,
				width: photo.asset.width,
				height: photo.asset.height
			};
		}
		const widths = variantWidths(photo.asset.width);
		const formats = { jpeg: [] as string[], webp: [] as string[] };
		for (const format of ['jpeg', 'webp'] as const)
			for (const width of widths) {
				const filename = `${photo.id}.${hash}-${width}.${format === 'jpeg' ? 'jpg' : 'webp'}`;
				const target = path.join(outputDirectory, filename);
				expectedFiles.add(filename);
				if (!(await fileExists(target))) {
					// Marked after the resize, so the text is rendered at the size it will be seen at
					// rather than being downsampled along with the photograph.
					const height = Math.round((photo.asset.height * width) / photo.asset.width);
					const resized = sharp(buffer)
						.resize({ width, withoutEnlargement: true })
						.toColourspace('srgb')
						.composite([{ input: watermarkOverlay(mark, width, height), top: 0, left: 0 }]);
					const pixels =
						format === 'jpeg'
							? await resized
									.jpeg({ quality: variantSettings.jpegQuality, mozjpeg: true })
									.toBuffer()
							: await resized.webp({ quality: variantSettings.webpQuality }).toBuffer();
					await writeFile(`${target}.tmp`, pixels);
					await rename(`${target}.tmp`, target);
				}
				await inspectImage(target, {
					width,
					height: Math.round((photo.asset.height * width) / photo.asset.width)
				});
				formats[format].push(`/images/photography/${filename} ${width}w`);
			}
		images.push({
			id: photo.id,
			src: formats.jpeg.at(-1)!.split(' ')[0],
			fallbackSrc: formats.jpeg[Math.min(1, formats.jpeg.length - 1)].split(' ')[0],
			srcset: formats.jpeg.join(', '),
			webpSrcset: formats.webp.join(', '),
			...(download ? { download } : {}),
			title: titleOf(photo),
			alt: photo.alt || '',
			caption: photo.caption,
			decorative: photo.decorative,
			width: photo.asset.width,
			height: photo.asset.height,
			location: photo.location,
			capturedAt: photo.captured.local,
			capturedOffset: photo.captured.offset,
			...(photo.coordinates ? { coordinates: photo.coordinates } : {}),
			photoEssay: photoEssays.get(photo.id) ?? null
		});
	}
	// This directory is generated and owned by this pipeline. A production build cleans
	// images from an earlier local draft preview before Vite copies static assets.
	for (const filename of await readdir(outputDirectory)) {
		if (!expectedFiles.has(filename))
			await rm(path.join(outputDirectory, filename), { force: true });
	}
	return images.toSorted(
		(a, b) => captureSortValue(b) - captureSortValue(a) || a.id.localeCompare(b.id)
	);
}
