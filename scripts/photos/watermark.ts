import sharp, { type Sharp } from 'sharp';

/**
 * The provenance mark burned into every image this site serves.
 *
 * It is applied per output size, after the resize, so the text is rendered at
 * the size it will actually be seen at rather than being downsampled with the
 * photograph. Black text carries a white outline: black alone disappears into a
 * dark photograph, and the outline also gives JPEG something high-contrast to
 * hold on to, so the mark survives the quality settings the gallery ships at.
 *
 * The source files in .local are never touched.
 */
export const watermarkSettings = {
	site: 'nebve.com',
	// One decimal second is roughly three metres, and keeps the string legible at the smallest width.
	secondDecimals: 1,
	// A fraction of the output width, so the mark reads the same at 480 and at 2400.
	sizeRatio: 0.022,
	minimumSize: 11,
	paddingRatio: 0.025,
	minimumPadding: 8,
	outlineRatio: 0.18,
	// The site's own typeface, kept for identity; the outline is what makes it hold up small.
	fontFamily: "'Times New Roman', Times, serif",
	version: 3
};

export interface WatermarkSubject {
	title?: string | null;
	captured: { local: string; offset: string | null };
	coordinates?: { latitude: number; longitude: number };
}

// The degree sign is escaped alongside the markup characters so the overlay stays pure ASCII,
// rather than depending on the SVG rasterizer inferring the buffer's encoding.
function escapeText(value: string) {
	return value.replace(/[&<>"'\u00b0]/g, (character) => `&#${character.charCodeAt(0)};`);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * One coordinate in degrees, minutes and seconds.
 *
 * Sexagesimal is how a place is written on a map and read aloud, so the mark
 * says where a photograph was made in the form a reader already knows, rather
 * than in the decimal form the file happens to store.
 */
export function toDms(value: number, positive: string, negative: string) {
	const hemisphere = value < 0 ? negative : positive;
	const total = Math.abs(value);
	let degrees = Math.floor(total);
	let minutes = Math.floor((total - degrees) * 60);
	let seconds = (total - degrees - minutes / 60) * 3600;
	// Rounding the seconds can carry into the minutes, and the minutes into the degrees.
	seconds = Number(seconds.toFixed(watermarkSettings.secondDecimals));
	if (seconds >= 60) {
		seconds -= 60;
		minutes += 1;
	}
	if (minutes >= 60) {
		minutes -= 60;
		degrees += 1;
	}
	const fixed = seconds.toFixed(watermarkSettings.secondDecimals);
	return `${degrees}\u00b0${String(minutes).padStart(2, '0')}'${fixed.padStart(watermarkSettings.secondDecimals ? 4 : 2, '0')}"${hemisphere}`;
}

/**
 * `nebve.com 52\u00b021'29.7"N 4\u00b052'50.8"E 01 Jan 2026 19:52:06`.
 *
 * Coordinates are omitted entirely when a photograph has none. Latitude leads,
 * as it does when a position is written or spoken.
 */
export function watermarkText(subject: WatermarkSubject) {
	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
		subject.captured.local
	);
	if (!match) throw new Error(`Unusable capture time "${subject.captured.local}".`);
	const [, year, month, day, hour, minute, second] = match;
	const monthName = MONTHS[Number(month) - 1];
	if (!monthName) throw new Error(`Unusable capture month "${subject.captured.local}".`);
	const parts = [watermarkSettings.site];
	if (subject.coordinates) {
		const { latitude, longitude } = subject.coordinates;
		parts.push(`${toDms(latitude, 'N', 'S')} ${toDms(longitude, 'E', 'W')}`);
	}
	parts.push(`${day} ${monthName} ${year}`, `${hour}:${minute}:${second ?? '00'}`);
	return parts.join(' ');
}

/** The mark as an SVG overlay sized for one specific output. */
export function watermarkOverlay(subject: WatermarkSubject, width: number, height: number) {
	return overlaySvg(watermarkText(subject), width, height, subject.title);
}

function overlaySvg(text: string, width: number, height: number, title?: string | null) {
	const size = Math.max(
		watermarkSettings.minimumSize,
		Math.round(width * watermarkSettings.sizeRatio)
	);
	const padding = Math.max(
		watermarkSettings.minimumPadding,
		Math.round(width * watermarkSettings.paddingRatio)
	);
	const stroke = Math.max(1, size * watermarkSettings.outlineRatio);
	// Keep long titles inside the frame without clipping or changing the photograph's crop.
	const titleSize = title
		? Math.min(size * 1.5, (width - 2 * padding) / (title.length * 0.65))
		: size;
	const titleText = title
		? `<text x="${padding}" y="${padding + titleSize}" font-family="${watermarkSettings.fontFamily}" ` +
			`font-size="${titleSize}" paint-order="stroke fill" stroke="#ffffff" ` +
			`stroke-width="${Math.max(1, titleSize * watermarkSettings.outlineRatio)}" ` +
			`stroke-opacity="0.85" stroke-linejoin="round" fill="#000000">${escapeText(title)}</text>`
		: '';
	// paint-order draws the outline beneath the fill, so the letterforms stay their true weight.
	return Buffer.from(
		`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
			`<text x="${padding}" y="${height - padding}" ` +
			`font-family="${watermarkSettings.fontFamily}" font-size="${size}" ` +
			`paint-order="stroke fill" stroke="#ffffff" stroke-width="${stroke}" ` +
			`stroke-opacity="0.85" stroke-linejoin="round" fill="#000000">` +
			`${escapeText(text)}</text>${titleText}</svg>`
	);
}

/**
 * Composite the mark onto an image whose size is not known ahead of time.
 * The build knows its own output sizes and uses watermarkOverlay directly.
 */
export async function applyWatermark(image: Sharp, subject: WatermarkSubject) {
	const { data, info } = await image
		.toColourspace('srgb')
		.raw()
		.toBuffer({ resolveWithObject: true });
	return sharp(data, {
		raw: { width: info.width, height: info.height, channels: info.channels }
	}).composite([{ input: watermarkOverlay(subject, info.width, info.height), top: 0, left: 0 }]);
}
