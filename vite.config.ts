import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			prerender: {
				handleUnseenRoutes({ routes, message }) {
					const emptyCollectionRoutes = new Set(['/writing/[slug]', '/photography/essays/[slug]']);
					if (routes.some((route) => !emptyCollectionRoutes.has(route))) {
						throw new Error(message);
					}
				}
			},

			adapter: adapter({
				pages: 'build',
				assets: 'build',
				strict: true
			})
		})
	]
});
