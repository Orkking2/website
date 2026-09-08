<script lang="ts">
	import { catalogCount } from '$lib/content/catalog';

	/**
	 * A live count of what the site currently holds, so authored prose cannot
	 * claim a number the catalog no longer supports. Name a source, or a
	 * directory page whose children should be counted.
	 */
	let { of: source, noun }: { of: string; noun?: string } = $props();
	const count = $derived(catalogCount(source));
</script>

{count}{#if noun}&nbsp;{noun}{count === 1 ? '' : 's'}{/if}
