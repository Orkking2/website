import { error } from '@sveltejs/kit';
import { publishedWritingEntries } from '$lib/content/catalog';

export function entries() {
	return publishedWritingEntries.map((entry) => ({ slug: entry.slug }));
}

export function load({ params }) {
	const entry = publishedWritingEntries.find((candidate) => candidate.slug === params.slug);
	if (!entry) error(404, 'Writing entry not found');

	return { entry };
}
