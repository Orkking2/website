<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * An aside for work that is acknowledged but not yet done.
	 *
	 * It carries the draft-only marker, so the release check refuses to ship a
	 * launch build that still contains one.
	 */
	let { title = 'Coming soon', children }: { title?: string; children?: Snippet } = $props();
</script>

<aside class="editorial-notice" data-editorial-placeholder>
	<h2 class="eyebrow">{title}</h2>
	<div class="editorial-notice__body">{@render children?.()}</div>
</aside>
