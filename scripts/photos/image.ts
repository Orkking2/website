import path from 'node:path';
import sharp from 'sharp';

// Implementation candidates, pending Nicolas's cross-browser color/quality review.
export const variantSettings = {
	widths: [480, 800, 1200, 1600, 2400],
	jpegQuality: 86,
	webpQuality: 84,
	version: 1
};

/** Shared responsive sizes; never enlarge a raster master. */
export function variantWidths(width: number) {
	return [
		...new Set([...variantSettings.widths.filter((size) => size < width), Math.min(width, 2400)])
	];
}

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
