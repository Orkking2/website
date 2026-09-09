<script lang="ts">
	import type { CoverImage } from '$lib/content/catalog';

	/**
	 * The photograph a page opens with, held under the writing.
	 *
	 * It is not a background. The band stays where it is while the page moves,
	 * and the article — opaque, on the site's own black — rises over it and puts
	 * it away. So a visitor meets the header, then the photograph, then the
	 * writing, and the photograph leaves by being covered rather than by
	 * scrolling off. Nothing here moves on its own, so there is no motion to
	 * withdraw when a visitor has asked for less of it.
	 *
	 * Every cover is cropped into the same fixed band rather than sizing one for
	 * itself, so a page's opening does not change shape with the picture it
	 * names. That costs the edges of a photograph, and most of a portrait one,
	 * which is the trade Nicolas chose: a uniform opening at the width of the
	 * writing, over a frame that fits each photograph exactly.
	 */
	let { cover }: { cover: CoverImage } = $props();

	/**
	 * The band is the width of the writing, so the photograph is drawn at the
	 * measure and nothing about the picture itself changes that. The same string
	 * an essay's photographs use, because they now occupy the same column.
	 */
	const sizes = '(min-width: 62rem) 60rem, calc(100vw - 2rem)';
</script>

<div class="page-cover">
	<picture>
		{#if cover.webpSrcset}
			<source type="image/webp" srcset={cover.webpSrcset} {sizes} />
		{/if}
		<!-- The one image on the page worth fetching first: it is what a visitor lands on. -->
		<img
			src={cover.src}
			srcset={cover.srcset ?? undefined}
			sizes={cover.srcset ? sizes : undefined}
			alt={cover.alt}
			width={cover.width ?? undefined}
			height={cover.height ?? undefined}
			fetchpriority="high"
			decoding="async"
		/>
	</picture>
</div>
