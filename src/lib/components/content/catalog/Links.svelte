<script lang="ts">
	import type { Snippet } from 'svelte';

	/** A row of forward links, described for anyone navigating by landmark. */
	let { label, children }: { label: string; children?: Snippet } = $props();
</script>

<nav class="index-links" aria-label={label}>{@render children?.()}</nav>

<style>
	.index-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
		padding-top: clamp(1rem, 3vw, 2rem);
	}
</style>
