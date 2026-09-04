<script lang="ts">
	import { resolve } from '$app/paths';
	import PageMeta from '$lib/components/PageMeta.svelte';

	let { data } = $props();
</script>

<PageMeta
	title={data.entry.title}
	description={data.entry.summary}
	path={`/writing/${data.entry.slug}`}
/>

<article class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">
			Writing · <time datetime={data.entry.published}>{data.entry.published}</time>
		</p>
		<h1>{data.entry.title}</h1>
		<p class="lede">{data.entry.summary}</p>
	</header>

	<div class="prose">
		{#each data.entry.body as paragraph, index (index)}
			<p>{paragraph}</p>
		{/each}

		{#if data.entry.relatedProjects.includes('ubq')}
			<p><a href={resolve('/projects/ubq')}>Continue to the UBQ project hub</a></p>
		{/if}
	</div>
</article>
