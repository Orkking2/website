<script lang="ts">
	import ContentPage from '$lib/components/content/ContentPage.svelte';
	let { data } = $props();
</script>

<ContentPage page={data.page} />
