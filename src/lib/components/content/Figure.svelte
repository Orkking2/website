<script lang="ts">
	import { getContext } from 'svelte';
	import type { CatalogPage } from '$lib/content/catalog';
	let {
		src,
		alt,
		caption,
		width,
		height,
		pdf,
		sizes = 'calc(100vw - 2rem)'
	}: {
		src: string;
		alt: string;
		caption?: string;
		width?: number;
		height?: number;
		pdf?: string;
		sizes?: string;
	} = $props();
	const page = getContext<(() => CatalogPage) | undefined>('nebve:essay');
	const image = $derived(page?.().figures[src]);
</script>

<figure class="content-figure">
	<picture>
		{#if image?.webpSrcset}<source type="image/webp" srcset={image.webpSrcset} {sizes} />{/if}
		<img
			src={image?.src ?? src}
			srcset={image?.srcset}
			sizes={image?.srcset ? sizes : undefined}
			{alt}
			width={image?.width ?? width}
			height={image?.height ?? height}
			loading="lazy"
			decoding="async"
		/>
	</picture>
	{#if caption || pdf}
		<figcaption>
			{#if caption}<span>{caption}</span>{/if}
			{#if pdf}<a class="text-link" href={pdf}>Open as PDF</a>{/if}
		</figcaption>
	{/if}
</figure>

<style>
	.content-figure {
		margin: clamp(2rem, 6vw, 3.5rem) 0;
	}
	.content-figure img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--rule);
		background: var(--surface-subtle);
	}
	.content-figure figcaption {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1rem;
		max-width: var(--measure);
		margin-top: 0.6rem;
		color: var(--muted);
		font-size: 0.9rem;
		line-height: 1.55;
	}
</style>
