import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
	classifyFile,
	collectInputFiles,
	copyFileVerified,
	defaultReview,
	hashFile,
	mergeReviewDefaults,
	normalizeReviewPatch,
	parseExifCapture,
	reviewIssues,
	validateBatchName,
	validateStableId
} from './lib/core.mjs';

test('batch and stable ID validation rejects path traversal and unstable labels', () => {
	assert.equal(validateBatchName('summer-2026'), 'summer-2026');
	assert.equal(validateStableId('photo-123abc'), 'photo-123abc');
	assert.throws(() => validateBatchName('../summer'));
	assert.throws(() => validateBatchName('Summer'));
	assert.throws(() => validateStableId('photo_123'));
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

test('review validation keeps editorial fields distinct', () => {
	const review = defaultReview(
		'abcdef1234567890',
		{
			localValue: '2026-09-02T22:58:32',
			offset: '+02:00'
		},
		{ latitude: 41.40338, longitude: 2.17403 }
	);
	const item = { kind: 'image', review };
	assert.deepEqual(reviewIssues(item), ['Choose select, hold, or reject.']);
	assert.equal(review.coordinateLatitude, 41.40338);
	assert.equal(review.coordinateLongitude, 2.17403);
	assert.equal(review.includeCoordinates, false);

	const selected = normalizeReviewPatch(review, { status: 'selected' });
	assert.ok(reviewIssues({ kind: 'image', review: selected }).length >= 3);
	const complete = normalizeReviewPatch(selected, {
		captionReviewed: true,
		altText: 'A supplied description.',
		captureReviewed: true,
		galleryIncluded: true,
		includeCoordinates: true
	});
	assert.deepEqual(reviewIssues({ kind: 'image', review: complete }), []);
	assert.equal(complete.caption, '');
	assert.equal(complete.altText, 'A supplied description.');
	assert.throws(() => normalizeReviewPatch(complete, { coordinateLatitude: 91 }));
});

test('review migration backfills coordinate suggestions and removes manual gallery order', () => {
	const merged = mergeReviewDefaults(
		{ status: 'hold', galleryOrder: 4 },
		'abcdef1234567890',
		{ localValue: '2026-09-02T22:58:32', offset: '+02:00' },
		{ latitude: -33.8568, longitude: 151.2153 }
	);
	assert.equal(merged.status, 'hold');
	assert.equal(merged.capturedAt, '2026-09-02T22:58:32');
	assert.equal(merged.coordinateLatitude, -33.8568);
	assert.equal(merged.coordinateLongitude, 151.2153);
	assert.equal('galleryOrder' in merged, false);
});

test('selected photographs require a valid reviewed capture date and time', () => {
	const selected = normalizeReviewPatch(
		defaultReview('abcdef1234567890', { localValue: null, offset: null }),
		{ status: 'selected', captionReviewed: true, altText: 'A supplied description.' }
	);
	assert.ok(
		reviewIssues({ kind: 'image', review: selected }).includes(
			'Add the required capture date and time.'
		)
	);
	assert.throws(() => normalizeReviewPatch(selected, { capturedAt: '2026-02-31T12:00:00' }));
});

test('hash-based copy is idempotent and leaves the source unchanged', async () => {
	const directory = await mkdtemp(path.join(os.tmpdir(), 'nebve-photo-core-test-'));
	try {
		const source = path.join(directory, 'source.jpg');
		const destination = path.join(directory, 'private', 'copy.jpg');
		await writeFile(source, 'test-image-content');
		const sourceHash = await hashFile(source);
		assert.equal(await copyFileVerified(source, destination, sourceHash), true);
		assert.equal(await copyFileVerified(source, destination, sourceHash), false);
		assert.equal(await hashFile(source), sourceHash);
		assert.equal(await hashFile(destination), sourceHash);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test('recursive collection does not follow symbolic links', async (context) => {
	if (process.platform === 'win32') {
		context.skip('Symbolic-link permissions vary on Windows.');
		return;
	}
	const directory = await mkdtemp(path.join(os.tmpdir(), 'nebve-photo-scan-test-'));
	try {
		const nested = path.join(directory, 'nested');
		await mkdir(nested);
		await symlink('/private', path.join(directory, 'outside'));
		await writeFile(path.join(nested, 'one.JPG'), 'one');
		const result = await collectInputFiles(directory);
		assert.equal(result.files.length, 1);
		assert.equal(result.files[0].relativePath, path.join('nested', 'one.JPG'));
		assert.equal(result.warnings[0].code, 'symlink-skipped');
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
