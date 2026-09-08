<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Places the sections it contains side by side, stacking on narrow viewports. */
	let { children }: { children?: Snippet } = $props();
</script>

<div class="index-columns">{@render children?.()}</div>
