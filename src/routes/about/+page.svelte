<script lang="ts">
	import { resolve } from '$app/paths';
	import EditorialNotice from '$lib/components/EditorialNotice.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
</script>

<PageMeta
	title="About Me"
	description="Why Nicolas built this site, who it's for, and where his background and contact details will live."
	path="/about"
/>

<div class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">About Me</p>
		<h1>Why this site exists.</h1>
		<p class="lede">
			This is where I put work worth sharing: technical ideas explained carefully, photographs given
			room for their context, and the professional record made easy to find. I'd rather it be useful
			than impressive.
		</p>
	</header>

	<section class="statement" aria-labelledby="purpose-heading">
		<p class="eyebrow">Purpose</p>
		<div>
			<h2 id="purpose-heading">One site, several conversations.</h2>
			<p>
				A learner might arrive looking for an explanation of a concurrent queue. A recruiter or
				collaborator might want a quick account of me and the evidence behind it. Someone else might
				just be here for a photograph and its story. I want each of them to find a direct answer and
				an honest next step.
			</p>
		</div>
	</section>

	<div class="audience-list" aria-label="Intended audiences">
		<article>
			<p class="eyebrow">Technical reader</p>
			<h2>Move from discovery to understanding.</h2>
			<p>
				Begin with the public idea, then choose whether to inspect the reasoning, failed paths,
				implementation details, or primary resources.
			</p>
			<a class="text-link" href={resolve('/projects/ubq')}>Begin with UBQ</a>
		</article>
		<article>
			<p class="eyebrow">Recruiter or collaborator</p>
			<h2>Find the useful version quickly.</h2>
			<p>
				My About and CV pages are still thin, but they're meant to give you a readable professional
				path without turning the whole site into a résumé.
			</p>
			<a class="text-link" href={resolve('/cv')}>Open the CV</a>
		</article>
		<article>
			<p class="eyebrow">Curious visitor</p>
			<h2>See what else is worth noticing.</h2>
			<p>
				Writing and photography make room for ideas and images that don't belong inside a project
				overview.
			</p>
			<a class="text-link" href={resolve('/photography')}>Enter Photography</a>
		</article>
	</div>

	<EditorialNotice title="Coming soon">
		<p>This page exists before the content does. Here's what I still need to write and approve:</p>
		<ul class="check-list">
			<li>A short, first-person biography and background</li>
			<li>An experience preview that points to the full CV instead of repeating it</li>
			<li>The contact methods and external profiles I'm comfortable making public</li>
		</ul>
	</EditorialNotice>
</div>
