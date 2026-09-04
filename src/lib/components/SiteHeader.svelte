<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { navigation, site } from '$lib/data/site';

	function isCurrent(href: string) {
		return page.url.pathname === href;
	}

	function isInSection(href: string) {
		return isCurrent(href) || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<header class="site-header">
	<div class="site-header__inner">
		<a class="site-name" href={resolve('/')} aria-label={`${site.name}, home`}>
			<span>{site.name}</span>
		</a>

		<nav aria-label="Primary navigation">
			<ul>
				{#each navigation as item (item.path)}
					<li>
						<a
							href={resolve(item.href)}
							aria-current={isCurrent(item.href) ? 'page' : undefined}
							data-section-active={isInSection(item.href) ? true : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</header>
