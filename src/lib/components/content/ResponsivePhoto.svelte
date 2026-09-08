<script lang="ts">
	import type { GalleryImage } from '$lib/content/catalog';

	/**
	 * One photograph, at whatever width the page around it gives it.
	 *
	 * Every frame is lazy and low priority: which photograph is worth fetching
	 * first depends on the address the visitor arrived at, and only the gallery's
	 * head script (`photoPreload`) can know that. The viewer raises its own copy
	 * when it opens one.
	 */
	let { photo, sizes = '100vw' }: { photo: GalleryImage; sizes?: string } = $props();
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
		loading="lazy"
		fetchpriority="low"
		decoding="async"
	/>
</picture>
