<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import '$lib/styles/global.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#f4f1e9" />
</svelte:head>

<a class="skip-link" href="#main-content">Skip to main content</a>
<SiteHeader />
<main id="main-content">
	{@render children()}
</main>
<SiteFooter />
