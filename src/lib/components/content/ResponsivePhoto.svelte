<script lang="ts">
	import type { GalleryImage } from '$lib/content/catalog';
	let {
		photo,
		sizes = '100vw',
		priority = false
	}: { photo: GalleryImage; sizes?: string; priority?: boolean } = $props();
</script>

<picture>
	<source type="image/webp" srcset={photo.webpSrcset} {sizes} />
	<img
		src={photo.fallbackSrc}
		srcset={photo.srcset}
		{sizes}
		alt={photo.decorative ? '' : photo.alt}
		width={photo.width}
		height={photo.height}
		loading={priority ? 'eager' : 'lazy'}
		fetchpriority={priority ? 'high' : 'auto'}
		decoding="async"
	/>
</picture>
