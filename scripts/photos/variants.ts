import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileExists, projectRoot } from '../content/index.ts';
import {
	captureSortValue,
	isReady,
	titleOf,
	type GalleryImage,
	type PhotoRecord
} from '../content/schema.ts';
import { watermarkOverlay, watermarkSettings } from './watermark.ts';

// Implementation candidates, pending Nicolas's cross-browser color/quality review.
export const variantSettings = {
	widths: [480, 800, 1200, 1600, 2400],
	jpegQuality: 86,
	webpQuality: 84,
	version: 1
};

export async function inspectImage(filename: string, expected?: { width: number; height: number }) {
	const metadata = await sharp(filename).metadata();
	if (
		metadata.exif ||
		metadata.xmp ||
		metadata.iptc ||
		metadata.comments?.length ||
		(metadata.orientation && metadata.orientation !== 1)
	) {
		throw new Error(
			`${path.basename(filename)}: Unapproved embedded metadata or orientation; sanitize the master before building.`
		);
	}
	if (expected && (metadata.width !== expected.width || metadata.height !== expected.height))
		throw new Error(
			`${path.basename(filename)}: Image dimensions differ from the reviewed record.`
		);
	return metadata;
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
		const master = path.join(root, `src/content/photography/.photogrid/masters/${photo.id}.jpg`);
		await inspectImage(master, photo.asset);
		const buffer = await readFile(master);
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
		const widths = [
			...new Set([
				...variantSettings.widths.filter((width) => width < photo.asset.width),
				Math.min(photo.asset.width, 2400)
			])
		];
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
