<script lang="ts">
	import { resolve } from '$app/paths';
	import EditorialNotice from '$lib/components/EditorialNotice.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
</script>

<PageMeta
	title="CV"
	description="A concise, web-readable professional record for Nicolas, paired with an approved PDF when available."
	path="/cv"
/>

<div class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">CV</p>
		<h1>The short path through the work.</h1>
		<p class="lede">
			For a recruiter or collaborator, this page is meant to do the practical work of a business
			card: establish context quickly, make the evidence easy to reach, and provide a clear next
			step.
		</p>
	</header>

	<section class="cv-standard" aria-labelledby="cv-standard-heading">
		<div>
			<p class="eyebrow">Reading standard</p>
			<h2 id="cv-standard-heading">Readable. Informative. Efficient.</h2>
		</div>
		<p>
			The HTML version will be the primary accessible record. A separately reviewed PDF will be an
			obvious download, not the only way to read the information.
		</p>
	</section>

	<EditorialNotice title="Authoritative CV needed">
		<p>
			No employers, dates, roles, education, achievements, contact details, or approved PDF are in
			the repository. The proposal establishes this page’s purpose, but not those facts.
		</p>
	</EditorialNotice>

	<div class="content-grid">
		<section class="content-card">
			<div>
				<p class="eyebrow">HTML CV</p>
				<h2>Fast to scan on any screen.</h2>
			</div>
			<p>
				Structured experience data can also power a shorter About preview without allowing dates or
				descriptions to drift.
			</p>
			<a class="text-link" href={resolve('/about')}>Return to About Me</a>
		</section>
		<section class="content-card">
			<div>
				<p class="eyebrow">Reviewed PDF</p>
				<h2>A direct download.</h2>
			</div>
			<p>The link will appear only after an approved PDF and filename exist in the repository.</p>
		</section>
	</div>
</div>
