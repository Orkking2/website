<script lang="ts">
	import type { Snippet } from 'svelte';
	import { catalogEntries, getPage, type CatalogReference } from '$lib/content/catalog';
	import Entry from './Entry.svelte';

	/**
	 * A numbered list of a directory page's children, newest first. Any rows
	 * written as children follow the real ones, which is how a working topic sits
	 * below what has actually been published.
	 */
	let {
		from,
		limit,
		grouped = false,
		children
	}: { from: string; limit?: number | string; grouped?: boolean; children?: Snippet } = $props();
	const rows = $derived.by(() => {
		if (limit === undefined) return undefined;
		// A Markdown attribute arrives as a string, so reject anything that is not a whole count.
		const count = Number(limit);
		if (!Number.isInteger(count) || count < 0)
			throw new Error(`<Entries limit="${limit}"> needs a whole number of rows.`);
		return count;
	});
	const entries = $derived(catalogEntries(from, rows));
</script>

{#snippet list(rows: CatalogReference[])}
	<ol class="working-index">
		{#each rows as entry (entry.route)}
			<Entry from={entry.route} />
		{/each}
	</ol>
{/snippet}

{#if grouped}
	{@const standalone = entries.filter((entry) => !getPage(entry.route).directory)}
	{#if standalone.length}{@render list(standalone)}{/if}
	{#each entries.filter((entry) => getPage(entry.route).directory) as collection (collection.route)}
		<section
			class="writing-collection"
			aria-labelledby={`collection-${getPage(collection.route).name}`}
		>
			<h2 id={`collection-${getPage(collection.route).name}`}>
				<a href={collection.route}>{collection.title}</a>
			</h2>
			{#if collection.summary}<p>{collection.summary}</p>{/if}
			{@render list(catalogEntries(collection.route))}
		</section>
	{/each}
	{#if children}<ol class="working-index">{@render children()}</ol>{/if}
{:else}
	<ol class="working-index">
		{#each entries as entry (entry.route)}<Entry from={entry.route} />{/each}
		{@render children?.()}
	</ol>
{/if}

<style>
	/* The rows are separate components, and .working-index li is not a list item, so count explicitly. */
	.working-index {
		counter-reset: index-entry;
	}

	.working-index :global(li) {
		counter-increment: index-entry;
	}

	.working-index :global(li)::before {
		content: counter(index-entry, decimal-leading-zero);
		color: var(--text-secondary);
		font-size: 0.75rem;
	}
</style>
