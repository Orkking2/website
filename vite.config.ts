import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { mdsvex } from 'mdsvex';
import { contentComponentsPlugin } from './scripts/content/components.ts';
import { contentWatchPlugin, generateContent } from './scripts/content/generate.ts';

export default defineConfig(async ({ command }) => {
	// Unfinished work is a warning while you write and an error when you build.
	const strict = command !== 'serve';
	await generateContent({ strict });
	return {
		plugins: [
			contentWatchPlugin(),
			sveltekit({
				extensions: ['.svelte', '.md', '.svx'],
				// The component imports are added before MDsveX compiles the Markdown.
				preprocess: [
					contentComponentsPlugin(),
					mdsvex({ extensions: ['.md', '.svx'], highlight: false })
				],
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: adapter({
					pages: 'build',
					assets: 'build',
					strict: true
				})
			})
		]
	};
});
