<script lang="ts">
	import { bodies } from '$lib/content/.generated/bodies';

	/** The compiled Markdown of the page served at this path. */
	let { route }: { route: string } = $props();
	let Body = $derived(bodies[route]);
</script>

{#if Body}<Body />{/if}
