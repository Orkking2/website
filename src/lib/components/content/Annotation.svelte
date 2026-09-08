<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<details class="annotation-note" open>
	<summary>{title}</summary>
	{@render children()}
</details>
