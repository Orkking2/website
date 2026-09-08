<script lang="ts">
	import { resolve } from '$app/paths';
	import { navigation } from '$lib/content/catalog';
	import { site } from '$lib/data/site';
</script>

<footer class="site-footer">
	<div class="site-footer__inner">
		<p>
			{site.url.replace('https://', '')} <span aria-hidden="true">·</span> Research, writing, photography
		</p>
		<nav aria-label="Footer navigation">
			<ul>
				{#each navigation as item (item.path)}
					<li><a href={resolve('/[...path]', { path: item.path.slice(1) })}>{item.label}</a></li>
				{/each}
			</ul>
		</nav>
	</div>
</footer>
