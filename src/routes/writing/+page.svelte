<script lang="ts">
	import { resolve } from '$app/paths';
	import EditorialNotice from '$lib/components/EditorialNotice.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { publishedPhotoEssays, publishedWritingEntries } from '$lib/content/catalog';
	import { plannedWriting } from '$lib/data/vision';

	const articles = publishedWritingEntries.toSorted((a, b) =>
		b.published.localeCompare(a.published)
	);
	const essays = publishedPhotoEssays.toSorted((a, b) => b.published.localeCompare(a.published));
	const dateFormatter = new Intl.DateTimeFormat('en', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});

	function formatDate(date: string) {
		return dateFormatter.format(new Date(`${date}T00:00:00Z`));
	}
</script>

<PageMeta
	title="Writing"
	description="Research and technical writing from Nicolas: design reasoning, experiments, implementation details, and links back to the projects they develop."
	path="/writing"
/>

<div class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">Writing</p>
		<h1>The work behind the result.</h1>
		<p class="lede">
			An implementation has more to teach than its final form. These articles will make room for the
			algorithms, decisions, experiments, and failed approaches that shaped the work.
		</p>
	</header>

	{#if articles.length > 0}
		<section aria-labelledby="articles-heading">
			<div class="section-heading section-heading--compact">
				<p class="eyebrow">Research / Tech</p>
				<div><h2 id="articles-heading">Published articles</h2></div>
			</div>
			<div class="entry-list">
				{#each articles as article (article.slug)}
					<article>
						<time datetime={article.published}>{formatDate(article.published)}</time>
						<div>
							<h3>
								<a href={resolve('/writing/[slug]', { slug: article.slug })}>{article.title}</a>
							</h3>
							<p>{article.summary}</p>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{:else}
		<EditorialNotice title="Writing still in development">
			<p>
				No article is presented as published. Finished copy still needs an approved summary, real
				publication date, and editorial sign-off before it receives a public URL.
			</p>
		</EditorialNotice>

		<section class="workbench" aria-labelledby="workbench-heading" data-draft-only>
			<div>
				<p class="eyebrow">Editorial view</p>
				<h2 id="workbench-heading">Planned lines of inquiry.</h2>
				<p>These working titles are topics, not promises of finished articles.</p>
			</div>
			<ol class="planned-list">
				{#each plannedWriting as title, index (title)}
					<li><span>{String(index + 1).padStart(2, '0')}</span>{title}</li>
				{/each}
			</ol>
		</section>
	{/if}

	<section class="writing-photo-link" aria-labelledby="photo-writing-heading">
		<div>
			<p class="eyebrow">Photo essays</p>
			<h2 id="photo-writing-heading">Images with their context intact.</h2>
			<p>
				Photo essays live canonically in Photography and remain discoverable here without creating
				duplicate copies.
			</p>
			<a class="text-link" href={resolve('/photography/essays')}>Explore Photo Essays</a>
		</div>
		{#if essays.length > 0}
			<ul class="resource-list">
				{#each essays as essay (essay.slug)}
					<li>
						<a href={resolve('/photography/essays/[slug]', { slug: essay.slug })}>{essay.title}</a>
						<time datetime={essay.published}>{formatDate(essay.published)}</time>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
