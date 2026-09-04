<script lang="ts">
	import { resolve } from '$app/paths';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { getProject } from '$lib/content/catalog';
	import { site } from '$lib/data/site';
	import { plannedWriting, principles, projectDepths, visitorPaths } from '$lib/data/vision';

	const ubq = getProject('ubq');
</script>

<PageMeta title={site.name} description={site.description} path="/" />

<div class="page-shell">
	<section class="hero" aria-labelledby="home-heading">
		<div>
			<p class="eyebrow">Algorithms · Essays · Photography</p>
			<h1 id="home-heading">A place to discover, then understand.</h1>
			<p class="lede">
				Nicolas is building a personal forum for the algorithms, reasoning, and experiments behind
				his work—and for photographs whose context deserves to be recorded. Each subject should be
				approachable at first glance and deep enough for the reader who wants the details.
			</p>
		</div>
		<aside class="hero__note" aria-label="How to use this site">
			<strong>Choose your depth</strong>
			Start with the explanation you need. Project pages move from a plain-language orientation to technical
			evidence without asking every visitor to read every detail.
		</aside>
	</section>

	<section class="home-section" aria-labelledby="research-heading">
		<div class="section-heading">
			<p class="eyebrow">01 · Featured research</p>
			<div>
				<h2 id="research-heading">UBQ, from interface to internals.</h2>
				<p>The first project hub is organized as a route through the work, not a wall of detail.</p>
			</div>
		</div>

		<div class="research-feature">
			<article class="feature-card feature-card--accent">
				<div>
					<p class="eyebrow">{ubq.status}</p>
					<h3>{ubq.title}</h3>
					<p>{ubq.summary}</p>
				</div>
				<a class="text-link" href={resolve('/projects/ubq')}>Begin with UBQ</a>
			</article>

			<ol class="depth-preview" aria-label="Levels of a project explanation">
				{#each projectDepths as depth, index (depth.label)}
					<li>
						<span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
						<div>
							<strong>{depth.label}</strong>
							<p>{depth.question}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<section class="home-section" aria-labelledby="writing-heading">
		<div class="section-heading">
			<p class="eyebrow">02 · Writing</p>
			<div>
				<h2 id="writing-heading">The work behind the result.</h2>
				<p>
					Design decisions, failed paths, benchmarks, and implementation details can each become a
					useful explanation in their own right.
				</p>
			</div>
		</div>

		<div class="writing-preview" data-draft-only>
			<div>
				<p class="eyebrow">On the workbench</p>
				<p class="lede lede--compact">
					These are planned lines of inquiry, not published articles. Finished writing will receive
					real dates, stable URLs, and deliberate links back to the project it develops.
				</p>
				<a class="text-link" href={resolve('/writing')}>Explore Writing</a>
			</div>
			<ol class="planned-list">
				{#each plannedWriting as title, index (title)}
					<li><span>{String(index + 1).padStart(2, '0')}</span>{title}</li>
				{/each}
			</ol>
		</div>
	</section>

	<section class="home-section photography-preview" aria-labelledby="photography-heading">
		<div class="photography-preview__statement">
			<p class="eyebrow">03 · Photography</p>
			<h2 id="photography-heading">The photograph is only half the record.</h2>
		</div>
		<div class="photography-preview__body">
			<p>
				A selected gallery will make room for images to stand on their own. Photo essays will keep
				the short account of where, when, or why an image mattered when that context belongs beside
				it.
			</p>
			<p class="quiet-note">
				Only photographs, sequencing, captions, and public metadata approved by Nicolas will appear
				here.
			</p>
			<a class="text-link" href={resolve('/photography')}>Enter Photography</a>
		</div>
	</section>

	<section class="home-section" aria-labelledby="principles-heading">
		<div class="section-heading">
			<p class="eyebrow">04 · A useful standard</p>
			<div>
				<h2 id="principles-heading">Three tests for every page.</h2>
				<p>A page succeeds when it gives the reader a useful answer and a clear next step.</p>
			</div>
		</div>

		<dl class="principle-list">
			{#each principles as principle, index (principle.name)}
				<div>
					<span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
					<dt>{principle.name}</dt>
					<dd>{principle.summary}</dd>
					<dd class="principle-list__prompt">{principle.prompt}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="home-section" aria-labelledby="paths-heading">
		<div class="section-heading">
			<p class="eyebrow">05 · Find your route</p>
			<div>
				<h2 id="paths-heading">What brought you here?</h2>
				<p>Choose the closest question. The surrounding paths stay available from every page.</p>
			</div>
		</div>

		<div class="route-list">
			{#each visitorPaths as path (path.audience)}
				<article>
					<div>
						<p class="eyebrow">{path.audience}</p>
						<h3>{path.question}</h3>
					</div>
					<div class="link-pair">
						<a href={resolve(path.primaryHref)}>{path.primaryLabel}</a>
						<a href={resolve(path.secondaryHref)}>{path.secondaryLabel}</a>
					</div>
				</article>
			{/each}
		</div>
	</section>
</div>
