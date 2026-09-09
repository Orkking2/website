import assert from 'node:assert/strict';
import test from 'node:test';
import { compile as markdown } from 'mdsvex';
import { compile as svelte } from 'svelte/compiler';
import { parseFragment, type DefaultTreeAdapterTypes as Html } from 'parse5';
import { markdownOptions } from './markdown.ts';

function elements(node: Html.Node): Html.Element[] {
	return [
		...('tagName' in node ? [node] : []),
		...('childNodes' in node ? node.childNodes.flatMap(elements) : [])
	];
}

function attribute(node: Html.Element, name: string) {
	return node.attrs.find((attribute) => attribute.name === name)?.value;
}

function text(node: Html.Node): string {
	if ('value' in node) return node.value;
	return 'childNodes' in node ? node.childNodes.map(text).join('') : '';
}

async function render(source: string) {
	const compiled = await markdown(source, { ...markdownOptions, filename: 'footnotes.md' });
	assert.ok(compiled);
	const result = svelte(compiled.code, { generate: 'server', runes: true });
	assert.deepEqual(
		result.warnings.filter((warning) => warning.code.startsWith('a11y')),
		[]
	);
	return elements(parseFragment(compiled.code));
}

test('footnotes are numbered by first use, with unique anchors and a return link for every citation', async () => {
	const nodes = await render(`First.[^source] Second.[^other] Again.[^SOURCE]

[^other]: Defined first, cited second.
[^source]: Defined second, cited first.
`);
	const refs = nodes.filter((node) => attribute(node, 'role') === 'doc-noteref');
	assert.deepEqual(refs.map(text), ['1', '2', '1']);
	assert.equal(attribute(refs[0], 'href'), attribute(refs[2], 'href'));
	const ids = nodes.map((node) => attribute(node, 'id')).filter(Boolean);
	assert.equal(new Set(ids).size, ids.length);
	const backs = nodes.filter((node) => attribute(node, 'role') === 'doc-backlink');
	assert.equal(backs.length, 3);
	for (const ref of refs) {
		assert.ok(backs.some((back) => attribute(back, 'href') === `#${attribute(ref, 'id')}`));
		assert.ok(attribute(ref, 'aria-label'));
	}
	for (const link of [...refs, ...backs]) {
		assert.ok(ids.includes(attribute(link, 'href')!.slice(1)));
		assert.ok(attribute(link, 'aria-label'));
	}
	const notes = nodes.filter((node) => node.tagName === 'li');
	assert.match(text(notes[0]), /Defined second, cited first/);
	assert.match(text(notes[1]), /Defined first, cited second/);
	assert.ok(
		nodes.some(
			(node) => node.tagName === 'section' && attribute(node, 'aria-label') === 'Footnotes'
		)
	);
});

test('note bodies retain links, emphasis, code, and multiple paragraphs', async () => {
	const nodes = await render(`A claim.[^detail]

[^detail]: A [source](https://example.com) with *emphasis* and \`code\`.

    A second paragraph.
`);
	const note = nodes.find((node) => node.tagName === 'li')!;
	const body = elements(note);
	assert.ok(body.some((node) => attribute(node, 'href') === 'https://example.com'));
	assert.ok(body.some((node) => node.tagName === 'em' && text(node) === 'emphasis'));
	assert.ok(body.some((node) => node.tagName === 'code' && text(node) === 'code'));
	assert.equal(body.filter((node) => node.tagName === 'p').length, 2);
});

test('code examples, escaped markers, and HTML comments do not create footnotes', async () => {
	const nodes = await render(`Inline \`[^inline]\` and escaped \\[^escaped].

\`\`\`markdown
[^example]: This is an example, not a note.
\`\`\`

<!-- Editorial note: [^private] is not a citation. -->
`);
	assert.ok(!nodes.some((node) => attribute(node, 'role') === 'doc-noteref'));
	assert.ok(!nodes.some((node) => attribute(node, 'class') === 'footnotes'));
	assert.ok(nodes.some((node) => node.tagName === 'code' && text(node) === '[^inline]'));
});

test('a missing definition fails compilation with the authored label', async () => {
	await assert.rejects(render('A claim.[^missing]'), /Missing footnote definition: \[\^missing\]/);
});

test('unused definitions do not produce an empty footnote section', async () => {
	const nodes = await render('Plain prose.\n\n[^unused]: Not cited.');
	assert.ok(!nodes.some((node) => attribute(node, 'class') === 'footnotes'));
});
