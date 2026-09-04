<script lang="ts">
	import { resolve } from '$app/paths';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { getProject } from '$lib/content/catalog';
	import { site } from '$lib/data/site';
	import { plannedWriting } from '$lib/data/vision';

	const ubq = getProject('ubq');
	const writingPreview = plannedWriting.slice(0, 3);
</script>

<PageMeta title={site.name} description={site.description} path="/" />

<div class="page-shell home-index" data-identity-prototype data-draft-only>
	<header class="home-index__intro">
		<p class="index-label">Index / identity prototype</p>
		<h1>Technical work, writing, and photography.</h1>
		<p>
			An evolving record of research, explanations, and photographs. Each entry begins with a
			concise orientation and opens into the reasoning, evidence, or context behind it.
		</p>
	</header>

	<section class="index-block index-block--featured" aria-labelledby="research-heading">
		<header class="index-block__heading">
			<span aria-hidden="true">01</span>
			<h2 id="research-heading">Research &amp; Projects</h2>
		</header>

		<article class="featured-entry">
			<div>
				<p class="entry-meta">Featured / {ubq.status}</p>
				<h3><a href={resolve('/projects/ubq')}>{ubq.title}</a></h3>
				<p>{ubq.summary}</p>
			</div>
			<a class="index-link" href={resolve('/projects/ubq')}>
				Project overview <span aria-hidden="true">→</span>
			</a>
		</article>
	</section>

	<div class="index-columns">
		<section class="index-block" aria-labelledby="writing-heading">
			<header class="index-block__heading">
				<span aria-hidden="true">02</span>
				<h2 id="writing-heading">Writing</h2>
			</header>

			<ol class="working-index">
				{#each writingPreview as title, index (title)}
					<li>
						<span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
						<div>
							<p>{title}</p>
							<small>Working topic</small>
						</div>
					</li>
				{/each}
			</ol>

			<a class="index-link" href={resolve('/writing')}>
				Writing index <span aria-hidden="true">→</span>
			</a>
		</section>

		<section class="index-block" aria-labelledby="photography-heading">
			<header class="index-block__heading">
				<span aria-hidden="true">03</span>
				<h2 id="photography-heading">Photography</h2>
			</header>

			<div class="photography-index">
				<p class="entry-meta">Selection in progress</p>
				<p>
					A filterless gallery will preserve the proportions of selected photographs. Images with
					additional context will lead to a canonical photo essay.
				</p>
			</div>

			<a class="index-link" href={resolve('/photography')}>
				Photography index <span aria-hidden="true">→</span>
			</a>
		</section>
	</div>

	<section class="index-block index-block--about" aria-labelledby="about-heading">
		<header class="index-block__heading">
			<span aria-hidden="true">04</span>
			<h2 id="about-heading">About &amp; CV</h2>
		</header>

		<div class="about-index">
			<p>
				Personal background and the professional record remain concentrated in their own pages,
				leaving the rest of the site to foreground the work.
			</p>
			<nav aria-label="About and CV links">
				<a class="index-link" href={resolve('/about')}>About Me <span aria-hidden="true">→</span></a
				>
				<a class="index-link" href={resolve('/cv')}>CV <span aria-hidden="true">→</span></a>
			</nav>
		</div>
	</section>
</div>
