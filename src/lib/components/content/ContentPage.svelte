<script lang="ts">
	import { setContext } from 'svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import ArticleBody from './ArticleBody.svelte';
	import ContentBody from './ContentBody.svelte';
	import EssayPhoto from './EssayPhoto.svelte';
	import PageCover from './PageCover.svelte';
	import PhotoViewer from './PhotoViewer.svelte';
	import Entries from './catalog/Entries.svelte';
	import { findPage, type CatalogPage } from '$lib/content/catalog';

	/**
	 * The one shell every page is rendered in.
	 *
	 * What appears comes from the page's own frontmatter: `layout` chooses the
	 * shape, and a facet renders only when the page declares it — resources when
	 * it lists `links`, a closing sequence when it names `images`, an annotation
	 * rail when it asks for `annotations`.
	 */
	let { page }: { page: CatalogPage } = $props();

	// <Photo of="name"> in the body resolves its name against this page.
	setContext('nebve:essay', () => page);

	const parent = $derived(page.parent ? findPage(page.parent) : undefined);
	const eyebrow = $derived(page.eyebrow ?? (page.depth > 1 ? (parent?.title ?? null) : null));
	const heading = $derived(page.headline ?? page.title);
	// Whatever the writing did not place itself closes the page, in the order it was named.
	const remaining = $derived(page.images.filter((image) => !image.placed));
	const resources = $derived(
		Object.entries(page.links ?? {}).filter(([, url]) => url) as Array<[string, string]>
	);
	const linkLabels: Record<string, string> = {
		paper: 'Paper / Preprint',
		code: 'Source code',
		docs: 'Documentation',
		demo: 'Demo'
	};
	const related = $derived(page.related.map(findPage).filter((entry) => entry !== undefined));
	/**
	 * A page opens with its cover photograph unless it shows that photograph anyway.
	 *
	 * An essay names one of its own images as its cover, and those images are all
	 * on the page already — placed where the writing wanted them, or closing it.
	 * Opening with one as well would print it twice. So in practice the band
	 * belongs to a page that names a photograph it does not otherwise show, which
	 * is what an index does.
	 */
	const cover = $derived(
		page.cover && !page.images.some((image) => image.src === page.cover?.src) ? page.cover : null
	);
</script>

<PageMeta
	title={page.title}
	description={page.summary || page.title}
	path={page.route}
	noIndex={!page.listed}
	type={page.published ? 'article' : 'website'}
	published={page.published}
	updated={page.updated}
/>

{#snippet intro()}
	{@const named = [eyebrow, page.status].filter(Boolean).join(' / ')}
	{#if named || page.published || page.updated || page.inProgress}
		<p class="eyebrow">
			{named}
			{#if page.published}{named ? '·' : ''} Published
				<time datetime={page.published}>{page.published}</time>{/if}
			{#if page.updated}
				· Last revised <time datetime={page.updated}>{page.updated}</time>{/if}
			{#if page.inProgress}<span class="status">In progress</span>{/if}
		</p>
	{/if}
	<h1>{heading}</h1>
	{#if page.summary}<p class="lede">{page.summary}</p>{/if}
{/snippet}

{#snippet trailing()}
	{#if resources.length}
		<ul class="resource-list">
			{#each resources as [kind, url] (kind)}
				<li><a href={url} rel="external">{linkLabels[kind] ?? kind}</a></li>
			{/each}
		</ul>
	{/if}
	{#if remaining.length}
		<div class="essay-images">
			{#each remaining as image (image.alias)}
				<EssayPhoto {image} />
			{/each}
		</div>
	{/if}
	{#if related.length}
		<nav class="related-content" aria-label="Related pages">
			{#each related as entry (entry.route)}
				<p><a href={entry.route}>Continue to {entry.title}</a></p>
			{/each}
		</nav>
	{/if}
	{#if parent && parent.depth > 1}
		<nav class="collection-reading" aria-label={`More in ${parent.title}`}>
			<h2><a href={parent.route}>{parent.title}</a></h2>
			<Entries from={parent.route} />
		</nav>
	{/if}
{/snippet}

{#if page.viewer}<PhotoViewer />{/if}

<!-- The cover is a sibling of the shell, not a child of it, because it stays put
     while the shell scrolls over it: the two have to be able to overlap. -->
{#if cover}<PageCover {cover} />{/if}

{#if page.layout === 'home'}
	<div class="page-shell home-index" class:page-shell--covered={cover} data-identity-prototype>
		<header class="home-index__intro">
			{#if eyebrow}<p class="index-label">{eyebrow}</p>{/if}
			<h1>{heading}</h1>
			{#if page.summary}<p>{page.summary}</p>{/if}
		</header>
		<ContentBody route={page.route} />
		{@render trailing()}
	</div>
{:else}
	<article class="page-shell" class:page-shell--covered={cover}>
		<header class="page-intro">{@render intro()}</header>
		<ArticleBody route={page.route} annotations={page.annotations} />
		{@render trailing()}
	</article>
{/if}
