import { error } from '@sveltejs/kit';
import { publishedPhotoEssays } from '$lib/content/catalog';

export function entries() {
	return publishedPhotoEssays.map((essay) => ({ slug: essay.slug }));
}

export function load({ params }) {
	const essay = publishedPhotoEssays.find((candidate) => candidate.slug === params.slug);
	if (!essay) error(404, 'Photo essay not found');

	return { essay };
}
