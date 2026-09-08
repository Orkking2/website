<script lang="ts">
	import type { Snippet } from 'svelte';

	/** The index's forward link. `to` is an ordinary site path, as in Markdown. */
	let { to, children }: { to: string; children?: Snippet } = $props();
</script>

<a class="index-link" href={to}>{@render children?.()} <span aria-hidden="true">→</span></a>
