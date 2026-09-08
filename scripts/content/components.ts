import type { PreprocessorGroup } from 'svelte/compiler';

/**
 * Components an authored Markdown file may use without writing an import.
 *
 * Authoring stays plain Markdown; these tags exist for the one thing Markdown
 * cannot express — embedding a live part of another page. Adding a name here is
 * a deliberate widening of the authoring vocabulary, so keep the list short and
 * keep every entry documented in docs/authoring.md.
 */
export const contentComponents = {
	Section: '$lib/components/content/catalog/Section.svelte',
	Columns: '$lib/components/content/catalog/Columns.svelte',
	Featured: '$lib/components/content/catalog/Featured.svelte',
	Entries: '$lib/components/content/catalog/Entries.svelte',
	Entry: '$lib/components/content/catalog/Entry.svelte',
	Link: '$lib/components/content/catalog/Link.svelte',
	Links: '$lib/components/content/catalog/Links.svelte',
	Count: '$lib/components/content/catalog/Count.svelte',
	Photo: '$lib/components/content/Photo.svelte',
	PhotoGrid: '$lib/components/content/PhotoGrid.svelte',
	Notice: '$lib/components/content/Notice.svelte',
	Figure: '$lib/components/content/Figure.svelte',
	Annotation: '$lib/components/content/Annotation.svelte'
} as const;

export type ContentComponent = keyof typeof contentComponents;

/** Tags whose `from` attribute names another page by its path. */
export const embeddingComponents = ['Featured', 'Entry', 'Entries'] as const;

/** Blank out fenced and inline code so documented examples are never treated as authored markup. */
export function stripCode(body: string) {
	let fence: string | null = null;
	return body
		.split('\n')
		.map((line) => {
			const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
			if (fence) {
				if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
				return '';
			}
			if (marker) {
				fence = marker;
				return '';
			}
			return line.replace(/`[^`]*`/g, '');
		})
		.join('\n');
}

export interface ContentTag {
	name: string;
	attributes: Record<string, string>;
	line: number;
}

/** Locate authored uses of the named components, outside code, with their literal attributes. */
export function findTags(body: string, names: readonly string[]): ContentTag[] {
	const source = stripCode(body);
	const pattern = new RegExp(`<(${names.join('|')})(?=[\\s/>])([^>]*?)/?>`, 'g');
	return [...source.matchAll(pattern)].map((match) => ({
		name: match[1],
		// Expression attributes such as from={value} are deliberately skipped: only a literal is checkable.
		attributes: Object.fromEntries(
			[
				...match[2].matchAll(/([A-Za-z][\w-]*)\s*=\s*"([^"]*)"|([A-Za-z][\w-]*)\s*=\s*'([^']*)'/g)
			].map((attribute) => [attribute[1] ?? attribute[3], attribute[2] ?? attribute[4]])
		),
		line: source.slice(0, match.index).split('\n').length
	}));
}

export function usedComponents(source: string): ContentComponent[] {
	const body = stripCode(source);
	return (Object.keys(contentComponents) as ContentComponent[]).filter((name) =>
		new RegExp(`<${name}(?=[\\s/>])`).test(body)
	);
}

/**
 * Give an authored file the imports for the components it actually uses.
 *
 * The block is appended rather than inserted so every authored line keeps its
 * original number in compiler errors; MDsveX hoists a trailing script into the
 * instance script when it assembles the component.
 */
export function withComponentImports(source: string) {
	const used = usedComponents(source);
	if (!used.length) return source;
	const imports = used.map((name) => `\timport ${name} from '${contentComponents[name]}';`);
	return `${source}\n\n<script lang="ts">\n${imports.join('\n')}\n</script>\n`;
}

/** Runs before MDsveX so authored Markdown never carries an import block. */
export function contentComponentsPlugin(): PreprocessorGroup {
	return {
		name: 'nebve-content-components',
		markup({ content, filename }) {
			if (!filename || !/\.(md|svx)$/.test(filename)) return;
			const code = withComponentImports(content);
			return code === content ? undefined : { code };
		}
	};
}
