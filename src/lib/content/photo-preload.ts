import type { GalleryImage } from './catalog';

/**
 * The gallery's first image request, chosen from the address bar.
 *
 * A link to a single photograph — `/photography#photo-b35fd29488de` — opens that
 * photograph over the grid, so it, and not whichever frame the page happens to
 * begin with, is what the visitor is waiting for. The choice can only be made in
 * the browser, because a fragment never reaches the server, so it is made here in
 * the head, before the parser has reached a single frame.
 *
 * Asking for it first is not enough on its own: the frames behind the viewer are
 * lazy, but the browser still starts them, and a dozen small images finish ahead
 * of the one large one. So while a photograph is named, the grid is marked as
 * skipped — a lazy image in a subtree that is not rendered is never requested —
 * and the mark is lifted the moment the photograph has arrived. Nothing else on
 * the page is touched, and a stale link that names nothing marks nothing.
 *
 * Without a fragment there is nothing to wait for: the first photograph is asked
 * for early, at the width the grid will use, and the grid loads as it always does.
 */
export function photoPreload(photos: GalleryImage[], gridSizes: string) {
	// Only generated candidates and the grid's own `sizes` enter the script; escape
	// HTML's script terminator so neither can close it early.
	const data = JSON.stringify({
		photos: photos.map(({ id, webpSrcset }) => [id, webpSrcset]),
		gridSizes
	}).replaceAll('<', '\\u003c');
	return `<script>
(() => {
	const { photos, gridSizes } = ${data};
	const targeted = photos.find(([id]) => '#' + id === location.hash);
	const photo = targeted || photos[0];
	if (!photo) return;
	const preload = document.createElement('link');
	preload.rel = 'preload';
	preload.as = 'image';
	preload.type = 'image/webp';
	// Set as attributes: a browser that honours these but not their properties still reads them.
	preload.setAttribute('imagesrcset', photo[1]);
	// A named photograph is opened full-viewport, so it is the viewer's candidate that
	// is wanted; the first photograph is met in the grid, at the grid's own width.
	preload.setAttribute('imagesizes', targeted ? '100vw' : gridSizes);
	preload.setAttribute('fetchpriority', 'high');
	if (targeted) {
		const root = document.documentElement;
		root.dataset.photoFocus = photo[0];
		// However this ends — arrived, failed, or a browser that reports neither — the
		// grid comes back. It is never left waiting on something that may not happen.
		const release = () => delete root.dataset.photoFocus;
		preload.addEventListener('load', release);
		preload.addEventListener('error', release);
		setTimeout(release, 4000);
	}
	document.head.append(preload);
})();
</script>`;
}
