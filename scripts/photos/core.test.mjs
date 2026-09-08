import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyFile, parseExifCapture, validateStableId } from './lib/core.mjs';
import { backfillRecord } from './library.mjs';

test('stable IDs reject path traversal and unstable labels', () => {
	assert.equal(validateStableId('photo-2d18ef380301'), 'photo-2d18ef380301');
	for (const bad of ['../escape', 'Photo-1', 'trailing-', '', 'a'.repeat(65)])
		assert.throws(() => validateStableId(bad), /Stable photo IDs/);
});

test('file classification covers supported images, RAW, and Live Photo video formats', () => {
	assert.deepEqual(classifyFile('image.HEIC'), {
		kind: 'image',
		extension: '.heic',
		supportedFormat: 'heic'
	});
	assert.equal(classifyFile('image.jpeg').supportedFormat, 'jpeg');
	assert.equal(classifyFile('image.PNG').supportedFormat, 'png');
	assert.equal(classifyFile('image.DNG').kind, 'raw');
	assert.equal(classifyFile('image.MOV').kind, 'video');
	assert.equal(classifyFile('image.AAE').kind, 'sidecar');
	assert.equal(classifyFile('notes.txt').kind, 'unsupported');
});

test('capture suggestions preserve local time and explicit timezone without guessing', () => {
	assert.deepEqual(
		parseExifCapture({
			dateTimeOriginal: '2026:09:02 22:58:32',
			offsetTimeOriginal: '+02:00'
		}),
		{
			raw: '2026:09:02 22:58:32',
			localValue: '2026-09-02T22:58:32',
			offset: '+02:00',
			source: 'exif-original',
			timezoneStatus: 'explicit-offset'
		}
	);
	assert.equal(
		parseExifCapture({ dateTimeOriginal: '2026:09:02 22:58:32' }).timezoneStatus,
		'missing-offset'
	);
	assert.equal(parseExifCapture({}).timezoneStatus, 'missing-capture-time');
});

const record = () => ({
	id: 'photo-abc123456789',
	captured: { local: '2026-07-03T19:52:06', offset: '+02:00', precision: 'second' }
});

test('a record that already has what it needs is left alone, without reading the original', async () => {
	const full = { ...record(), coordinates: { latitude: 1, longitude: 2 } };
	// No paths are passed, so any attempt to reach the library or the original would throw.
	const result = await backfillRecord(full, {});
	assert.deepEqual(result.filled, []);
	assert.deepEqual(result.absent, []);
	assert.deepEqual(result.record.coordinates, { latitude: 1, longitude: 2 });
});

test('coordinates the cache still holds are filled in from it', async () => {
	const result = await backfillRecord(record(), {
		coordinates: { latitude: 41.4, longitude: 2.2 }
	});
	assert.deepEqual(result.filled, ['coordinates']);
	assert.deepEqual(result.absent, []);
	assert.deepEqual(result.record.coordinates, { latitude: 41.4, longitude: 2.2 });
});

test('an original already re-read once and found to have no GPS is reported, not read again', async () => {
	// refreshedAt is what stops a photograph taken with location off from being decoded
	// on every run: there is nothing to recover now or later.
	const result = await backfillRecord(record(), { coordinates: null, refreshedAt: 'once' });
	assert.deepEqual(result.filled, []);
	assert.deepEqual(result.absent, ['coordinates']);
	assert.equal(result.record.coordinates, undefined);
});

test('a missing capture offset is recovered and reported separately from coordinates', async () => {
	const undated = record();
	undated.captured.offset = null;
	const result = await backfillRecord(undated, {
		coordinates: null,
		capture: { offset: '+01:00' },
		refreshedAt: 'once'
	});
	assert.deepEqual(result.filled, ['UTC offset']);
	assert.deepEqual(result.absent, ['coordinates']);
	assert.equal(result.record.captured.offset, '+01:00');
});
