import { error } from '@sveltejs/kit';
import { findPage, pages } from '$lib/content/catalog';

/**
 * Every page on the site, from the content tree.
 *
 * One route serves all of them, so a new Markdown file — at any depth — becomes a
 * page without a route file of its own. The root's path is the empty string.
 */
export function entries() {
	return pages.map((page) => ({ path: page.route.slice(1) }));
}

export function load({ params }) {
	const route = params.path ? `/${params.path.replace(/\/$/, '')}` : '/';
	const page = findPage(route);
	if (!page) error(404, 'Page not found');
	return { page };
}
