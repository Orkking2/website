<script lang="ts">
	import { dealIntoColumns, galleryImages } from '$lib/content/catalog';
	import { photoPreload } from '$lib/content/photo-preload';
	import ResponsivePhoto from './ResponsivePhoto.svelte';
	import PhotoDownload from './PhotoDownload.svelte';

	/**
	 * The gallery of selected photographs, placed where the writing wants it.
	 *
	 * The grid is built from the photograph library rather than from the page, so
	 * an authored page decides only where it sits, and the order is the order the
	 * photographs were taken, newest first. A photograph that names a page of its
	 * own carries a marker through to it. The viewer these frames open belongs to
	 * the page shell, so an essay's photographs open the same one.
	 */
	let { label = 'Gallery' }: { label?: string } = $props();
	const headingId = 'photo-grid-heading';
	// Dealt once, when the page is built. Each photograph goes to whichever column is
	// shortest so far, so the columns stay level and a reader meets them in order.
	const columns = dealIntoColumns(galleryImages, 2);
	// Named once, because the preload in the head has to ask for the same candidate the
	// grid will ask for; two copies of this would quietly fetch the same photograph twice.
	const gridSizes =
		'(min-width: 90rem) 44rem, (min-width: 42rem) calc((100vw - 2rem) / 2), calc(100vw - 2rem)';
</script>

<svelte:head>
	<!-- Generated candidates are escaped by photoPreload; run before body images are discovered. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html photoPreload(galleryImages, gridSizes)}
</svelte:head>

<section aria-labelledby={headingId}>
	<h2 id={headingId} class="visually-hidden">{label}</h2>

	{#if galleryImages.length > 0}
		<div class="gallery-grid">
			{#each columns as column, columnIndex (columnIndex)}
				<div class="gallery-grid__column">
					{#each column as { item: photo, index } (photo.src)}
						<!-- `order` is where this photograph falls in the sequence, which is what
						     restores that sequence when the columns collapse into one. -->
						<figure id={photo.id} style={`order: ${index}`}>
							<!-- Stable links also locate the photograph without JavaScript. -->
							<a
								class="gallery-grid__frame"
								style={`aspect-ratio: ${photo.width} / ${photo.height}`}
								href={`/photography#${photo.id}`}
								data-photo-id={photo.id}
								data-photo-order={index}
								data-view-photo
								data-title={photo.title || 'Photograph'}
								data-caption={[photo.caption, photo.location].filter(Boolean).join(' — ')}
								aria-label={`View ${photo.title || 'photograph'}`}
							>
								<!-- Every frame waits: the head decides which photograph is fetched first. -->
								<ResponsivePhoto {photo} sizes={gridSizes} />
							</a>
							<figcaption>
								{#if photo.title}<span class="visually-hidden">{photo.title}. </span>{/if}
								{#if photo.caption}<p>{photo.caption}</p>{/if}
								{#if photo.location}<p>{photo.location}</p>{/if}
								<PhotoDownload {photo} />
								<!-- <div class="gallery-caption__links">
							<a
								href={`/photography#${photo.id}`}
								data-photo-permalink
								aria-label={`Link to ${photo.title || 'photograph'}`}>Link to photograph</a
							>
							<a href={photo.src} aria-label={`Open image: ${photo.title || 'photograph'}`}
								>Open image</a
							>
							{#if photo.photoEssay && findPage(photo.photoEssay)}
								<a href={photo.photoEssay}>Read {findPage(photo.photoEssay)?.title}.txt</a>
							{/if}
						</div> -->
								<!-- {#if photo.coordinates}
							<details class="photo-coordinates">
								<summary>Location coordinates</summary>
								<p>{photo.coordinates.latitude}, {photo.coordinates.longitude}</p>
							</details>
						{/if} -->
							</figcaption>
						</figure>
					{/each}
				</div>
			{/each}
		</div>
	{:else}
		<p class="empty-state" data-draft-only>I haven't selected photographs yet — coming soon.</p>
	{/if}
</section>
