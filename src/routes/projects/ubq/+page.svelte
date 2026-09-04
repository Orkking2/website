<script lang="ts">
	import { resolve } from '$app/paths';
	import EditorialNotice from '$lib/components/EditorialNotice.svelte';
	import PageMeta from '$lib/components/PageMeta.svelte';
	import { getProject, getPublishedWritingForProject } from '$lib/content/catalog';

	const project = getProject('ubq');
	const relatedWriting = getPublishedWritingForProject(project.slug);
	const resources = [
		{ label: 'Paper / Preprint', url: project.links.paper },
		{ label: 'Code / Repository', url: project.links.code },
		{ label: 'docs.rs Documentation', url: project.links.docs },
		{ label: 'Demo', url: project.links.demo }
	];
</script>

<PageMeta
	title="UBQ"
	description="An introduction to UBQ and a progressive path into its interface, design reasoning, resources, and related writing."
	path="/projects/ubq"
/>

<article class="page-shell">
	<header class="page-intro">
		<p class="eyebrow">Research & Projects / {project.status}</p>
		<h1>{project.title}</h1>
		<p class="lede">{project.summary}</p>
	</header>

	<section class="statement" aria-labelledby="reading-path-heading">
		<p class="eyebrow">How to read this project</p>
		<div>
			<h2 id="reading-path-heading">One subject, four depths.</h2>
			<p>
				Begin with the public idea. Continue only as far as your question requires; the paper,
				source, documentation, and related articles remain direct destinations rather than hidden
				interface actions.
			</p>
		</div>
	</section>

	<ol class="reading-path">
		<li>
			<div class="reading-path__marker" aria-hidden="true"><span>01</span></div>
			<section aria-labelledby="ubq-orient-heading">
				<p class="eyebrow">Orient</p>
				<h2 id="ubq-orient-heading">What kind of problem is this?</h2>
				<p>
					UBQ is concerned with unbounded multi-producer, multi-consumer FIFO queues. I'll explain
					that problem in plain language here before introducing the algorithm.
				</p>
			</section>
		</li>

		<li>
			<div class="reading-path__marker" aria-hidden="true"><span>02</span></div>
			<section aria-labelledby="ubq-use-heading">
				<p class="eyebrow">Use</p>
				<h2 id="ubq-use-heading">What does the public interface do?</h2>
				<p>
					I'll introduce the smallest useful vocabulary and concrete behavior of UBQ's public
					interface here, once the API itself has settled enough to describe honestly.
				</p>
			</section>
		</li>

		<li>
			<div class="reading-path__marker" aria-hidden="true"><span>03</span></div>
			<section aria-labelledby="ubq-inspect-heading">
				<p class="eyebrow">Inspect</p>
				<h2 id="ubq-inspect-heading">Why is it designed this way?</h2>
				<p>
					I want the deeper account to make the algorithms, trade-offs, experiments, and failed
					approaches legible through focused prose and original diagrams. I won't assert an
					architecture or performance result here until I can point to where it came from.
				</p>
			</section>
		</li>

		<li>
			<div class="reading-path__marker" aria-hidden="true"><span>04</span></div>
			<section aria-labelledby="ubq-verify-heading">
				<p class="eyebrow">Verify</p>
				<h2 id="ubq-verify-heading">Continue to the primary material.</h2>
				<div class="evidence-grid">
					<div>
						<h3>Resources</h3>
						<ul class="resource-list">
							{#each resources as resource (resource.label)}
								<li>
									<span>{resource.label}</span>
									{#if resource.url}
										<a class="external-link" href={resource.url} rel="external">Open resource</a>
									{:else}
										<span class="status">Coming soon</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
					<div>
						<h3>Related writing</h3>
						{#if relatedWriting.length > 0}
							<ul class="resource-list">
								{#each relatedWriting as entry (entry.slug)}
									<li>
										<a href={resolve('/writing/[slug]', { slug: entry.slug })}>{entry.title}</a>
									</li>
								{/each}
							</ul>
						{:else}
							<p>I haven't published any UBQ-related articles yet — coming soon.</p>
						{/if}
						<a class="text-link" href={resolve('/writing')}>Explore Writing</a>
					</div>
				</div>
			</section>
		</li>
	</ol>

	<EditorialNotice title="Coming soon">
		<p>This page is still thin. Here's what I still need to write and link:</p>
		<ul class="check-list">
			<li>A plain-language overview of the problem UBQ solves</li>
			<li>My contribution and role, stated plainly</li>
			<li>The public API description and a worked example</li>
			<li>Technical claims and figures, once they're ready to stand behind</li>
			<li>The paper and docs.rs links</li>
		</ul>
	</EditorialNotice>
</article>
