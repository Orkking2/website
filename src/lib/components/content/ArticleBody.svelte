<script lang="ts">
	import ContentBody from './ContentBody.svelte';
	let { route, annotations = false }: { route: string; annotations?: boolean } = $props();
</script>

<div class="article-reading">
	{#if annotations}
		<input class="article-reading__toggle" type="checkbox" id="article-annotations" checked />
		<label class="article-reading__label" for="article-annotations">Show annotations</label>
	{/if}
	<div class:article-flow--annotated={annotations} class="prose article-flow">
		<ContentBody {route} />
	</div>
</div>
