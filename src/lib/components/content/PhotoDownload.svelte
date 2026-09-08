<script lang="ts">
	import type { GalleryImage } from '$lib/content/catalog';
	let { photo }: { photo: GalleryImage } = $props();
</script>

{#if photo.download}
	<a href={photo.download.src} download data-photo-download>
		Download full resolution (WebP, {(photo.download.bytes / 1_000_000).toFixed(1)} MB)
	</a>
{/if}
