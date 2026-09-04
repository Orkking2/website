<script lang="ts">
	import { resolve } from '$app/paths';
	import EditorialNotice from '$lib/components/EditorialNotice.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
</script>

<PageMeta
	title="About Me"
	description="Why Nicolas is building this site, who it is for, and where his approved background and contact details will live."
	path="/about"
/>

<div class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">About Me</p>
		<h1>Why this site exists.</h1>
		<p class="lede">
			This is a place for Nicolas to distribute work worth sharing: technical ideas explained
			carefully, photographs given room for their context, and professional information made easy to
			find. It is meant to be useful before it is impressive.
		</p>
	</header>

	<section class="statement" aria-labelledby="purpose-heading">
		<p class="eyebrow">Purpose</p>
		<div>
			<h2 id="purpose-heading">One site, several conversations.</h2>
			<p>
				A learner may arrive looking for an explanation of a concurrent queue. A recruiter or
				collaborator may need a quick account of the person and the evidence. Someone else may be
				here for a photograph and its story. Each should find a direct answer and an honest next
				step.
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
				The finished About and CV pages will provide a readable professional path without turning
				the whole site into a résumé.
			</p>
			<a class="text-link" href={resolve('/cv')}>Open the CV</a>
		</article>
		<article>
			<p class="eyebrow">Curious visitor</p>
			<h2>See what else is worth noticing.</h2>
			<p>
				Writing and photography make room for ideas and images that do not belong inside a project
				overview.
			</p>
			<a class="text-link" href={resolve('/photography')}>Enter Photography</a>
		</article>
	</div>

	<EditorialNotice title="Personal source needed">
		<p>
			The proposal establishes the purpose of this site, but not Nicolas’s publishable biography,
			experience, contact methods, or profile URLs. Those details remain absent until Nicolas
			provides and approves them.
		</p>
	</EditorialNotice>

	<div class="content-grid">
		<section class="content-card">
			<div>
				<p class="eyebrow">Biography / Background</p>
				<h2>The person behind the work.</h2>
			</div>
			<p>A concise first-person account will live here after editorial review.</p>
		</section>
		<section class="content-card">
			<div>
				<p class="eyebrow">Experience</p>
				<h2>A useful preview.</h2>
			</div>
			<p>This should orient a reader and lead to the full CV rather than duplicate it.</p>
			<a class="text-link" href={resolve('/cv')}>Review the CV path</a>
		</section>
		<section class="content-card">
			<div>
				<p class="eyebrow">Contact + external links</p>
				<h2>A clear next step.</h2>
			</div>
			<p>Only owner-approved contact methods and profile URLs will be published.</p>
		</section>
	</div>
</div>
