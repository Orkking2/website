<script lang="ts">
	import ResponsivePhoto from './ResponsivePhoto.svelte';
	import PhotoDownload from './PhotoDownload.svelte';
	import type { EssayImage } from '$lib/content/catalog';

	/**
	 * One of a page's own photographs, at the width of the article.
	 *
	 * The frame is a link, so the photograph opens in the same viewer the gallery
	 * uses — the enhancement binds `[data-view-photo]` wherever it appears. Without
	 * JavaScript the link still resolves, to the largest image that is served.
	 */
	let {
		image,
		sizes = '(min-width: 62rem) 60rem, calc(100vw - 2rem)'
	}: { image: EssayImage; sizes?: string } = $props();

	const described = $derived([image.caption, image.location].filter(Boolean).join(' — '));
</script>

<figure class="essay-photo" id={image.alias}>
	<a
		class="essay-photo__frame"
		href={image.src}
		data-photo-id={image.id}
		data-view-photo
		data-title={image.title}
		data-caption={described}
		aria-label={`View ${image.title}`}
	>
		<ResponsivePhoto photo={image} {sizes} />
	</a>
	{#if image.caption || image.title || image.download}
		<figcaption>
			{#if image.title}<b>{image.title}</b>{/if}
			{#if image.caption}<span>{image.caption}</span>{/if}
			<PhotoDownload photo={image} />
		</figcaption>
	{/if}
</figure>
