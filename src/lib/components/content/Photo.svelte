<script lang="ts">
	import { getContext } from 'svelte';
	import type { CatalogPage } from '$lib/content/catalog';
	import EssayPhoto from './EssayPhoto.svelte';

	/**
	 * One of this page's own photographs, placed where the writing needs it.
	 *
	 * The name is local to the page, so two photographs may share a title and
	 * still be addressed separately — and the name doubles as a link target, so
	 * `[the tombstone](#tombstone)` reaches this figure from anywhere on the page.
	 */
	let { of: alias }: { of: string } = $props();
	const essay = getContext<(() => CatalogPage) | undefined>('nebve:essay');
	const image = $derived(essay?.().images.find((candidate) => candidate.alias === alias));
</script>

{#if image}
	<EssayPhoto {image} />
{/if}
