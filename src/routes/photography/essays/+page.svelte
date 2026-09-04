<script lang="ts">
	import { resolve } from '$app/paths';
	import EditorialNotice from '$lib/components/EditorialNotice.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { publishedPhotoEssays } from '$lib/content/catalog';

	const essays = publishedPhotoEssays.toSorted((a, b) => b.published.localeCompare(a.published));
	const dateFormatter = new Intl.DateTimeFormat('en', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});
</script>

<PageMeta
	title="Photo Essays"
	description="The canonical home for Nicolas's photographs in sequence and context."
	path="/photography/essays"
/>

<div class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">Photography / Photo Essays</p>
		<h1>Photographs with something to remember.</h1>
		<p class="lede">
			A photo essay records the context that would otherwise stay only in the photographer’s
			imagination. It can be a sequence, a short written account, or one image that asks for both.
		</p>
	</header>

	{#if essays.length > 0}
		<div class="entry-list">
			{#each essays as essay (essay.slug)}
				<article>
					<time datetime={essay.published}
						>{dateFormatter.format(new Date(`${essay.published}T00:00:00Z`))}</time
					>
					<div>
						<h2>
							<a href={resolve('/photography/essays/[slug]', { slug: essay.slug })}>{essay.title}</a
							>
						</h2>
						<p>{essay.summary}</p>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<EditorialNotice>
			<p>
				No essay is published yet. A selected sequence, alternative text, captions, contextual
				writing, real dates, and publication approval are still required.
			</p>
		</EditorialNotice>
	{/if}
</div>
