import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { applyWatermark, toDms, watermarkOverlay, watermarkText } from './watermark.ts';
import { captureSortValue } from '../content/schema.ts';

const captured = { local: '2026-07-03T19:52:06', offset: '+02:00' };

test('the mark reads site, place in degrees, then the spelled-out date and time', () => {
	assert.equal(
		watermarkText({ captured, coordinates: { latitude: 41.3874, longitude: 2.1686 } }),
		'nebve.com 41\u00b023\'14.6"N 2\u00b010\'07.0"E 03 Jul 2026 19:52:06'
	);
});

test('a photograph with no coordinates is marked without that segment', () => {
	assert.equal(watermarkText({ captured }), 'nebve.com 03 Jul 2026 19:52:06');
});

test('a coordinate south or west of zero is marked by its hemisphere, not a minus sign', () => {
	assert.equal(toDms(-33.8688, 'N', 'S'), '33\u00b052\'07.7"S');
	assert.equal(toDms(-58.3816, 'E', 'W'), '58\u00b022\'53.8"W');
});

test('rounding a coordinate up carries into the minutes and degrees rather than reading 60', () => {
	// 8.999999 degrees is 8 degrees, 59 minutes, 59.996 seconds: every part rounds over at once.
	assert.equal(toDms(8.999999, 'N', 'S'), '9\u00b000\'00.0"N');
});

test('the month is written out, so a date cannot be read in the wrong order', () => {
	assert.match(
		watermarkText({ captured: { local: '2026-01-02T00:00:00', offset: null } }),
		/02 Jan 2026/
	);
});

test('seconds are filled in when a capture time records only minutes', () => {
	assert.match(
		watermarkText({ captured: { local: '2026-07-03T19:52', offset: null } }),
		/19:52:00$/
	);
});

test('an unusable capture time is refused rather than marked wrongly', () => {
	assert.throws(
		() => watermarkText({ captured: { local: 'yesterday', offset: null } }),
		/Unusable/
	);
});

test('the mark is drawn at a size proportional to the output it is drawn on', () => {
	const small = watermarkOverlay({ captured }, 480, 640).toString();
	const large = watermarkOverlay({ captured }, 2400, 3200).toString();
	const size = (svg: string) => Number(/font-size="(\d+)"/.exec(svg)![1]);
	assert.ok(size(large) > size(small) * 4, 'the mark should scale with the image');
	assert.ok(size(small) >= 11, 'the mark should never fall below a legible size');
});

test('marking changes the corner it writes into and leaves the rest of the frame alone', async () => {
	const plain = sharp({
		create: { width: 400, height: 300, channels: 3, background: '#3a3a3a' }
	});
	const marked = await (await applyWatermark(plain, { captured })).png().toBuffer();
	// stats() reads the input image, so each region has to be materialized before measuring.
	const corner = async (image: Buffer, top: number) => {
		const region = await sharp(image)
			.extract({ left: 0, top, width: 200, height: 40 })
			.png()
			.toBuffer();
		return (await sharp(region).stats()).channels[0].stdev;
	};
	// A flat field has no variation; the marked corner must.
	assert.ok((await corner(marked, 255)) > 5, 'the mark should be visible where it is written');
	assert.ok((await corner(marked, 10)) < 1, 'the rest of the photograph should be untouched');
});

test('a reviewed title is embedded at the top, escaped, and leaves the center unchanged', async () => {
	const subject = { captured, title: 'Stone & <light>' };
	assert.ok(watermarkOverlay(subject, 400, 300).toString().includes('Stone &#38; &#60;light&#62;'));
	const image = sharp({ create: { width: 400, height: 300, channels: 3, background: '#3a3a3a' } });
	const marked = await (await applyWatermark(image, subject)).png().toBuffer();
	const deviation = async (top: number) => {
		const region = await sharp(marked)
			.extract({ left: 0, top, width: 200, height: 40 })
			.png()
			.toBuffer();
		return (await sharp(region).stats()).channels[0].stdev;
	};
	assert.ok((await deviation(0)) > 5);
	assert.ok((await deviation(120)) < 1);
});

test('the gallery is ordered by when a photograph was taken, newest first', () => {
	const shot = (capturedAt: string, capturedOffset: string | null = '+02:00') => ({
		capturedAt,
		capturedOffset
	});
	const gallery = [
		shot('2026-07-02T11:43:10'),
		shot('2026-09-02T22:58:32'),
		shot('2026-07-11T04:35:17')
	].toSorted((a, b) => captureSortValue(b) - captureSortValue(a));
	assert.deepEqual(
		gallery.map((photo) => photo.capturedAt),
		['2026-09-02T22:58:32', '2026-07-11T04:35:17', '2026-07-02T11:43:10']
	);
});

test('capture order compares real instants, not the wall clock each camera recorded', () => {
	// Same wall-clock reading, an hour apart in fact: the further-east photograph is earlier.
	const east = { capturedAt: '2026-07-02T12:00:00', capturedOffset: '+02:00' };
	const west = { capturedAt: '2026-07-02T12:00:00', capturedOffset: '+01:00' };
	assert.ok(captureSortValue(east) < captureSortValue(west));
});
