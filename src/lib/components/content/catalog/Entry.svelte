<script lang="ts">
	import { catalogEntry } from '$lib/content/catalog';
	import { getContext } from 'svelte';
	import type { CatalogPage } from '$lib/content/catalog';
	const currentPage = getContext<(() => CatalogPage) | undefined>('nebve:essay');

	/**
	 * One row of an index list. Either name a real page with from="/path", or
	 * state a working topic with title="…", which links nowhere because nothing
	 * has been published yet.
	 */
	let { from, title, note }: { from?: string; title?: string; note?: string } = $props();
	const entry = $derived(from ? catalogEntry(from) : null);
	const label = $derived.by(() => {
		const text = entry?.title ?? title;
		if (!text) throw new Error('<Entry> needs either from="/path" or title="…".');
		return text;
	});
	const detail = $derived(note ?? entry?.meta ?? null);
</script>

<li>
	<div>
		<p>
			{#if entry}<a
					href={entry.href}
					aria-current={currentPage?.().route === entry.route ? 'page' : undefined}>{label}</a
				>{:else}{label}{/if}
		</p>
		{#if detail}<small>{detail}</small>{/if}
	</div>
</li>
