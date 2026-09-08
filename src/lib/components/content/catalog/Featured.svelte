<script lang="ts">
	import type { Snippet } from 'svelte';
	import { catalogEntry } from '$lib/content/catalog';

	/**
	 * The index's largest treatment of a single page. Title, status or date,
	 * summary, and destination all come from that page's own source file; write
	 * children only to say something here that does not belong in its summary.
	 */
	let {
		from,
		label = 'Featured',
		link = 'Read more',
		children
	}: { from: string; label?: string; link?: string; children?: Snippet } = $props();
	const entry = $derived(catalogEntry(from));
</script>

<article class="featured-entry">
	<div>
		<p class="entry-meta">{[label, entry.meta].filter(Boolean).join(' / ')}</p>
		<h3><a href={entry.href}>{entry.title}</a></h3>
		{#if children}{@render children()}{:else if entry.summary}<p>{entry.summary}</p>{/if}
	</div>
	<a class="index-link" href={entry.href}>{link} <span aria-hidden="true">→</span></a>
</article>
