<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { navigation } from '$lib/content/catalog';
	import { site } from '$lib/data/site';

	function isCurrent(href: string) {
		return page.url.pathname === href;
	}

	function isInSection(href: string) {
		return isCurrent(href) || page.url.pathname.startsWith(`${href}/`);
	}

	/** One route serves the whole content tree, so every page is reached through it. */
	const href = (route: string) => resolve('/[...path]', { path: route.slice(1) });
</script>

<!-- The header is the same on every page and comes from the page tree, so adding a
     top-level page adds a link here without editing anything. -->
<header class="site-header">
	<div class="site-header__inner">
		<a class="site-name" href={href('/')} aria-label={`${site.name}, home`}>
			<span>{site.name}</span>
		</a>

		<nav aria-label="Primary navigation">
			<ul>
				{#each navigation as item (item.path)}
					<li>
						<a
							href={href(item.path)}
							aria-current={isCurrent(item.path) ? 'page' : undefined}
							data-section-active={isInSection(item.path) ? true : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</header>
