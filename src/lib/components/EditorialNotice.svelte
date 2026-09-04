<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		children: Snippet;
	}

	let { title = 'Coming soon', children }: Props = $props();
</script>

<aside class="editorial-notice" data-editorial-placeholder>
	<h2 class="eyebrow">{title}</h2>
	<div class="editorial-notice__body">{@render children()}</div>
</aside>
