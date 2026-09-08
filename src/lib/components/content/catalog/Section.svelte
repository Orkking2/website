<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A numbered block of the index. The number is generated in order of
	 * appearance, so reordering sections in Markdown renumbers them.
	 *
	 * layout="split" sets the block's prose against its links or entries,
	 * instead of stacking them.
	 */
	let {
		title,
		layout = 'stack',
		children
	}: { title: string; layout?: 'stack' | 'split'; children?: Snippet } = $props();
	const headingId = $derived(
		`index-${title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')}`
	);
</script>

<section class="index-block" aria-labelledby={headingId}>
	<header class="index-block__heading">
		<h2 id={headingId}>{title}</h2>
	</header>
	{#if layout === 'split'}
		<div class="index-block__split">{@render children?.()}</div>
	{:else}
		{@render children?.()}
	{/if}
</section>

<style>
	.index-block__heading {
		counter-increment: index-section;
	}

	.index-block__heading::before {
		content: counter(index-section, decimal-leading-zero);
		color: var(--text-secondary);
		font-size: 0.76rem;
	}

	.index-block > :global(p) {
		max-width: 34rem;
		margin: 0 0 1.4rem;
		color: var(--text-secondary);
		line-height: 1.65;
	}

	.index-block > :global(p:first-of-type) {
		padding-top: clamp(1.5rem, 4vw, 3rem);
	}

	.index-block__split {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		gap: clamp(2rem, 7vw, 7rem);
		padding: clamp(2.5rem, 5vw, 4.5rem) 0;
	}

	.index-block__split > :global(p) {
		max-width: 39rem;
		margin: 0;
		color: var(--text-secondary);
		line-height: 1.65;
	}

	.index-block__split > :global(*) {
		padding-top: 0;
	}

	@media (max-width: 42rem) {
		.index-block__split {
			grid-template-columns: 1fr;
		}
	}
</style>
