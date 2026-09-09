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
	 * The frame is the site's black, and the photograph is contained rather than
	 * cropped: covers arrive in both orientations, and a band wide enough for a
	 * landscape photograph would take a portrait one apart.
	 */
	let { cover }: { cover: CoverImage } = $props();

	/**
	 * How wide the photograph will actually be drawn.
	 *
	 * A contained photograph is bounded by the band's height as much as by the
	 * page's width — a landscape cover in a band two thirds of a screen tall is
	 * drawn at roughly half the width the shell would allow. Asking for the
	 * shell's width instead would fetch the 2400px variant on a dense display to
	 * draw about 1500 of them. The terms mirror `--cover-height` and the shell's
	 * width in `global.css`; a browser that cannot read them ignores the
	 * attribute and falls back to the full width, which is only the old
	 * behaviour.
	 */
	const aspect = $derived(cover.width && cover.height ? cover.width / cover.height : null);
	const sizes = $derived(
		aspect
			? `min(calc(100vw - 2rem), 88rem, calc(62vh * ${aspect.toFixed(4)}), calc(42rem * ${aspect.toFixed(4)}))`
			: '100vw'
	);
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
