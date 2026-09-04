<script lang="ts">
	import { resolve } from '$app/paths';
	import EditorialNotice from '$lib/components/EditorialNotice.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { galleryImages, publishedPhotoEssays } from '$lib/content/catalog';

	const essays = publishedPhotoEssays.toSorted((a, b) => b.published.localeCompare(a.published));
	const dateFormatter = new Intl.DateTimeFormat('en', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});
</script>

<PageMeta
	title="Photography"
	description="Selected photographs by Nicolas and photo essays that preserve the context behind an image."
	path="/photography"
/>

<div class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">Photography</p>
		<h1>The photograph is only half the record.</h1>
		<p class="lede">
			A selected image can stand on its own. When the where, when, or why is part of what gives it
			meaning, a photo essay keeps that context beside it.
		</p>
	</header>

	{#if galleryImages.length === 0 && essays.length === 0}
		<EditorialNotice title="Photographs needed">
			<p>
				Nicolas still needs to choose the images, order, captions, alternative text, approved
				metadata, and any permitted crops. No substitute photography has been added.
			</p>
		</EditorialNotice>
	{/if}

	<section aria-labelledby="gallery-heading">
		<div class="section-heading section-heading--compact">
			<p class="eyebrow">Selected gallery</p>
			<div>
				<h2 id="gallery-heading">A deliberate edit.</h2>
				<p>
					The gallery is for a focused sequence, with original aspect ratios and only the public
					metadata Nicolas approves.
				</p>
			</div>
		</div>

		{#if galleryImages.length > 0}
			<div class="gallery-grid">
				{#each galleryImages as photo (photo.src)}
					<figure>
						<img
							src={photo.src}
							alt={photo.decorative ? '' : photo.alt}
							width={photo.width}
							height={photo.height}
							loading="lazy"
						/>
						{#if photo.caption}<figcaption>{photo.caption}</figcaption>{/if}
					</figure>
				{/each}
			</div>
		{:else}
			<p class="empty-state" data-draft-only>Selected photographs will appear here after review.</p>
		{/if}
	</section>

	<section class="photo-essay-preview" aria-labelledby="essays-heading">
		<div>
			<p class="eyebrow">Photo essays</p>
			<h2 id="essays-heading">Images in sequence and context.</h2>
			<p>
				An essay may be a sequence with short passages or one photograph with a concise account.
				Each receives one canonical URL shared with Writing.
			</p>
			<a class="text-link" href={resolve('/photography/essays')}>Explore Photo Essays</a>
		</div>
		{#if essays.length > 0}
			<ul class="resource-list">
				{#each essays as essay (essay.slug)}
					<li>
						<a href={resolve('/photography/essays/[slug]', { slug: essay.slug })}>{essay.title}</a>
						<time datetime={essay.published}
							>{dateFormatter.format(new Date(`${essay.published}T00:00:00Z`))}</time
						>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
