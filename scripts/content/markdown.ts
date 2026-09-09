import type { MdsvexOptions } from 'mdsvex';
import footnotes from 'remark-footnotes';

/** The small HAST surface used here; MDsveX owns parsing and serialization. */
interface HtmlNode {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: HtmlNode[];
	value?: string;
}

function walk(
	node: HtmlNode,
	visit: (node: HtmlNode, parent?: HtmlNode) => void,
	parent?: HtmlNode
) {
	visit(node, parent);
	for (const child of node.children ?? []) walk(child, visit, node);
}

function hasClass(node: HtmlNode, name: string) {
	return Array.isArray(node.properties?.className) && node.properties.className.includes(name);
}

function text(value: string): HtmlNode {
	return { type: 'text', value };
}

/**
 * MDsveX's legacy footnote renderer prints labels and repeats reference IDs.
 * Keep its Markdown parsing, but give each citation a unique, accessible anchor
 * and number notes by their first reference, with a return link for every use.
 */
function accessibleFootnotes() {
	return (tree: HtmlNode) => {
		const definitions = new Map<string, HtmlNode>();
		const notes = new Map<string, { number: number; references: string[] }>();
		walk(tree, (node) => {
			if (!hasClass(node, 'footnotes')) return;
			const list = node.children?.find((child) => child.tagName === 'ol');
			for (const item of list?.children ?? []) {
				if (item.tagName === 'li' && typeof item.properties?.id === 'string')
					definitions.set(item.properties.id, item);
			}
		});

		walk(tree, (node, parent) => {
			if (!hasClass(node, 'footnote-ref')) return;
			const target = String(node.properties?.href).slice(1);
			if (!definitions.has(target))
				throw new Error(`Missing footnote definition: [^${target.replace(/^fn-/, '')}].`);
			let note = notes.get(target);
			if (!note) {
				note = { number: notes.size + 1, references: [] };
				notes.set(target, note);
			}
			const id = `content-fnref-${note.number}-${note.references.length + 1}`;
			note.references.push(id);
			if (parent?.tagName === 'sup') delete parent.properties?.id;
			node.properties = {
				...node.properties,
				id,
				href: `#content-fn-${note.number}`,
				role: 'doc-noteref',
				ariaLabel: `Footnote ${note.number}`
			};
			node.children = [text(String(note.number))];
		});

		for (const [target, note] of notes) {
			const definition = definitions.get(target)!;
			definition.properties!.id = `content-fn-${note.number}`;
			walk(definition, (node) => {
				if (!node.children) return;
				node.children = node.children.flatMap((child) => {
					if (!hasClass(child, 'footnote-backref')) return [child];
					return note.references.flatMap((id, index) => [
						text(' '),
						{
							type: 'element',
							tagName: 'a',
							properties: {
								href: `#${id}`,
								className: ['footnote-backref'],
								role: 'doc-backlink',
								ariaLabel: `Back to reference ${index + 1} for footnote ${note.number}`
							},
							children: [text(note.references.length === 1 ? '↩' : `↩${index + 1}`)]
						}
					]);
				});
			});
		}

		walk(tree, (node) => {
			if (!hasClass(node, 'footnotes')) return;
			node.tagName = 'section';
			node.properties!.ariaLabel = 'Footnotes';
			node.children = [
				{ type: 'element', tagName: 'h2', properties: {}, children: [text('Footnotes')] },
				...(node.children ?? []).filter((child) => child.tagName !== 'hr')
			];
		});
	};
}

/** Use the same Markdown features in development, production, and content checks. */
export const markdownOptions: MdsvexOptions = {
	extensions: ['.md', '.svx'],
	highlight: false,
	// Version 2 supports MDsveX's remark-parse 8; newer plugin APIs are incompatible.
	remarkPlugins: [footnotes],
	rehypePlugins: [accessibleFootnotes]
};
