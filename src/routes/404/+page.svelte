<script lang="ts">
	import { resolve } from '$app/paths';
	import PageMeta from '$lib/components/PageMeta.svelte';
</script>

<PageMeta
	title="Page not found"
	description="The requested page could not be found."
	path="/404"
	noIndex
/>

<div class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">404</p>
		<h1>That page is not here.</h1>
		<p class="lede">The address may have changed, or the page may not be part of the site yet.</p>
		<a class="text-link" href={resolve('/')}>Return home</a>
	</header>
</div>
