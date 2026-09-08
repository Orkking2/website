/**
 * Encode decoded pixels without a resize or lossy intermediate for new masters.
 * @param {import('sharp').Sharp} image
 * @param {{ format: 'webp' } | { format?: 'jpeg'; maxPixelSize: number; quality: number }} request
 */
export function encodeMaster(image, request) {
	const pixels = image.toColourspace('srgb');
	if (request.format === 'webp')
		return pixels.webp({ lossless: true, effort: 4 }).withIccProfile('srgb');
	// Compatibility for small metadata probes and older callers.
	return pixels
		.resize({
			width: request.maxPixelSize,
			height: request.maxPixelSize,
			fit: 'inside',
			withoutEnlargement: true
		})
		.jpeg({
			quality: Math.round(request.quality * 100),
			progressive: true,
			chromaSubsampling: '4:4:4'
		})
		.withIccProfile('srgb');
}

/**
 * A WebP filename alone does not establish that its pixels were encoded losslessly.
 * @param {Buffer} buffer
 */
export function isLosslessWebp(buffer) {
	if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP')
		return false;
	for (let offset = 12; offset + 8 <= buffer.length;) {
		const kind = buffer.toString('ascii', offset, offset + 4);
		const size = buffer.readUInt32LE(offset + 4);
		if (offset + 8 + size > buffer.length) return false;
		if (kind === 'VP8L') return true;
		if (kind === 'VP8 ' || kind === 'ANIM') return false;
		offset += 8 + size + (size % 2);
	}
	return false;
}
