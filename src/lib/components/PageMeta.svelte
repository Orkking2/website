<script lang="ts">
	import { site } from '$lib/data/site';

	interface Props {
		title: string;
		description: string;
		path: string;
		noIndex?: boolean;
		type?: 'website' | 'article';
		published?: string | null;
		updated?: string;
	}

	let {
		title,
		description,
		path,
		noIndex = false,
		type = 'website',
		published,
		updated
	}: Props = $props();
	let canonical = $derived(new URL(path, site.url).toString());
	let fullTitle = $derived(title === site.name ? site.title : `${title} — ${site.name}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="robots"
		content={site.indexable && !noIndex ? 'index, follow' : 'noindex, nofollow'}
	/>
	<meta property="og:type" content={type} />
	{#if type === 'article' && published}<meta
			property="article:published_time"
			content={published}
		/>{/if}
	{#if type === 'article' && updated}<meta
			property="article:modified_time"
			content={updated}
		/>{/if}
	<meta property="og:site_name" content={site.name} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
</svelte:head>
