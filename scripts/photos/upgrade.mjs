import { scanLibrary } from './library.mjs';
import { readContent } from '../content/index.ts';
import { isReady } from '../content/schema.ts';

const result = await scanLibrary({
	readyOnly: true,
	onProgress: ({ id }) => console.log(`Preparing ${id}…`)
});
const { photos } = await readContent();
const remaining = photos.filter((photo) => isReady(photo) && photo.asset.format !== 'webp');
if (remaining.length)
	throw new Error(
		`Originals are missing from the library for: ${remaining.map((photo) => photo.id).join(', ')}. Their legacy masters were retained.`
	);
console.log(`Prepared ${result.derivedCount} masters; reviewed photographs now use lossless WebP.`);
