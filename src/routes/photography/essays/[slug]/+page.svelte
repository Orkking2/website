<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte';

	let { data } = $props();
</script>

<PageMeta
	title={data.essay.title}
	description={data.essay.summary}
	path={`/photography/essays/${data.essay.slug}`}
/>

<article class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">
			Photo Essay · <time datetime={data.essay.published}>{data.essay.published}</time>
			{#if data.essay.inProgress}<span class="status">In progress</span>{/if}
		</p>
		<h1>{data.essay.title}</h1>
		<p class="lede">{data.essay.summary}</p>
	</header>

	<div class="prose" data-draft-only={data.essay.inProgress ? true : undefined}>
		{#each data.essay.body as paragraph, index (index)}
			<p>{paragraph}</p>
		{/each}
	</div>

	<div class="essay-images">
		{#each data.essay.images as image (image.src)}
			<section class="essay-image">
				<figure>
					<img
						src={image.src}
						alt={image.decorative ? '' : image.alt}
						width={image.width}
						height={image.height}
						loading="lazy"
					/>
					{#if image.caption}<figcaption>{image.caption}</figcaption>{/if}
				</figure>
				{#if image.context?.length}
					<div class="essay-image__context">
						{#each image.context as paragraph, index (index)}<p>{paragraph}</p>{/each}
					</div>
				{/if}
			</section>
		{/each}
	</div>
</article>
