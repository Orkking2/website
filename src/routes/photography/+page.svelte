<script lang="ts">
	import { resolve } from '$app/paths';
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
			A selected image can stand on its own. When the where, when, or why matters, a photo essay
			keeps that context beside it. Hover the <span aria-hidden="true">i</span> on a photograph for its
			caption.
		</p>
	</header>

	<section aria-labelledby="gallery-heading">
		<h2 id="gallery-heading" class="visually-hidden">Gallery</h2>

		{#if galleryImages.length > 0}
			<div class="gallery-grid">
				{#each galleryImages as photo, index (photo.src)}
					<figure>
						<div
							class="gallery-grid__frame"
							style={`aspect-ratio: ${photo.width} / ${photo.height}`}
						>
							<img
								src={photo.src}
								alt={photo.decorative ? '' : photo.alt}
								width={photo.width}
								height={photo.height}
								loading="lazy"
							/>
						</div>
						{#if photo.title}
							<figcaption><span>{photo.title}</span></figcaption>
						{/if}
						{#if photo.caption}
							<div class="photo-info">
								<button
									type="button"
									class="photo-info__toggle"
									aria-describedby={`photo-caption-${index}`}
								>
									<span aria-hidden="true">i</span>
									<span class="visually-hidden">Caption</span>
								</button>
								<p class="photo-info__caption" id={`photo-caption-${index}`}>{photo.caption}</p>
							</div>
						{/if}
					</figure>
				{/each}
			</div>
		{:else}
			<p class="empty-state" data-draft-only>I haven't selected photographs yet — coming soon.</p>
		{/if}
	</section>

	<section class="photo-essay-preview" aria-labelledby="essays-heading">
		<div>
			<p class="eyebrow">Photo essays</p>
			<h2 id="essays-heading">Images in sequence and context.</h2>
			<p>
				An essay may be a sequence with short passages or one photograph with a concise account.
				This is a new part of the site, so expect most essays to start life as works in progress.
			</p>
			<a class="text-link" href={resolve('/photography/essays')}>Explore Photo Essays</a>
		</div>
		{#if essays.length > 0}
			<ul class="resource-list">
				{#each essays as essay (essay.slug)}
					<li>
						<a href={resolve('/photography/essays/[slug]', { slug: essay.slug })}>{essay.title}</a>
						<span class="resource-list__meta">
							{#if essay.inProgress}<span class="status">In progress</span>{/if}
							<time datetime={essay.published}
								>{dateFormatter.format(new Date(`${essay.published}T00:00:00Z`))}</time
							>
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p>I haven't published a photo essay yet — coming soon.</p>
		{/if}
	</section>
</div>
