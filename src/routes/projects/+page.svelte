<script lang="ts">
	import { resolve } from '$app/paths';
	import EditorialNotice from '$lib/components/EditorialNotice.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { getProject } from '$lib/content/catalog';

	const ubq = getProject('ubq');
</script>

<PageMeta
	title="Research & Projects"
	description="Research and project hubs from Nicolas, beginning with UBQ and its path from overview to technical evidence."
	path="/projects"
/>

<div class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">Research & Projects</p>
		<h1>Start broad. Go as deep as you need.</h1>
		<p class="lede">
			A project hub should answer the first question plainly, then open deliberate paths into the
			reasoning, implementation, writing, and primary materials behind the work.
		</p>
	</header>

	<article class="project-lead" aria-labelledby="ubq-card-heading">
		<div class="project-lead__index" aria-hidden="true">01</div>
		<div class="project-lead__body">
			<p class="eyebrow">Featured project · {ubq.status}</p>
			<h2 id="ubq-card-heading">{ubq.title}</h2>
			<p>{ubq.summary}</p>
			<ul class="tag-list" aria-label="Project topics">
				{#each ubq.tags as tag (tag)}<li>{tag}</li>{/each}
			</ul>
		</div>
		<a class="text-link" href={resolve('/projects/ubq')}>Begin with the overview</a>
	</article>

	<EditorialNotice title="Project evidence needed">
		<p>
			The proposal supports UBQ’s subject and in-progress status. Its expanded name, Nicolas’s exact
			contribution, architecture, results, paper, repository, and docs.rs URLs have not been
			supplied and are not claimed here.
		</p>
	</EditorialNotice>
</div>
