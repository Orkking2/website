<script lang="ts">
	import galleryScript from '$lib/enhancements/gallery.js?url';

	/**
	 * The full-viewport viewer, and the script that drives it.
	 *
	 * It binds every `[data-view-photo]` link on the page, so the gallery grid and a
	 * photograph placed in an essay open the same viewer. The page shell renders it
	 * exactly once, and only where there are photographs to look at.
	 */
</script>

<svelte:head><script type="module" src={galleryScript}></script></svelte:head>

<!-- Clicking a photograph opens this on top of everything, header included. -->
<dialog class="photo-viewer" data-photo-viewer aria-labelledby="photo-viewer-title">
	<header>
		<h2 id="photo-viewer-title" data-viewer-title>Photograph</h2>
		<button type="button" data-viewer-close>Close</button>
	</header>
	<div class="photo-viewer__image" data-viewer-image></div>
	<p data-viewer-caption class="photo-viewer__caption"></p>
	<div class="photo-viewer__download">
		<a href="/photography" download data-viewer-download hidden>Download full resolution</a>
	</div>
	<nav aria-label="Photograph navigation">
		<button type="button" data-viewer-previous>Previous</button>
		<span data-viewer-position role="status" aria-live="polite"></span>
		<button type="button" data-viewer-next>Next</button>
	</nav>
</dialog>
