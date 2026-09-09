import catalog from './.generated/catalog.json';
import { site } from '$lib/data/site';
import type { CatalogPage, GalleryImage } from '../../../scripts/content/schema';
export type {
	CatalogPage,
	CoverImage,
	EssayImage,
	GalleryImage
} from '../../../scripts/content/schema';
export { dealIntoColumns } from '../../../scripts/content/schema';

export const pages = catalog.pages as CatalogPage[];
export const navigation = catalog.navigation as Array<{ path: string; label: string }>;
export const sitemapPaths = catalog.sitemap as string[];
export const galleryImages = catalog.galleryImages as GalleryImage[];
export const allImages = catalog.images as GalleryImage[];

const byRoute = new Map(pages.map((page) => [page.route, page]));

/** The page served at a path, or undefined when nothing is. */
export function findPage(route: string) {
	return byRoute.get(route);
}

export function getPage(route: string) {
	const page = byRoute.get(route);
	if (!page) throw new Error(`No page is served at "${route}".`);
	return page;
}

/** Pages one level below this one, in the order the tree gives them. */
export function childrenOf(route: string) {
	return getPage(route).children.map(getPage);
}

/** Every page that names its own photographs. */
export const essayPages = pages.filter((page) => page.images.length > 0);

// The build refuses to run while anything here is unfinished, so these are complete by construction.
export const publishedPages = pages.filter(
	(page): page is CatalogPage & { published: string; summary: string } =>
		typeof page.published === 'string'
);

if (site.indexable) {
	if (!publishedPages.some((page) => page.route.startsWith('/writing/')))
		throw new Error('Launch guard: Writing needs an approved article.');
	if (!galleryImages.length && !essayPages.length)
		throw new Error('Launch guard: Photography needs reviewed content.');
}

/**
 * Catalog access for authored Markdown embeds.
 *
 * These helpers exist so an authored page can name another page by its path and
 * receive whatever the catalog currently holds for it, rather than repeating a
 * title, summary, or date that will later drift.
 */
export interface CatalogReference {
	route: string;
	title: string;
	summary: string | null;
	meta: string | null;
	href: string;
}

const dateFormatter = new Intl.DateTimeFormat('en', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	timeZone: 'UTC'
});

export function formatDate(date: string) {
	return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function describe(page: CatalogPage): CatalogReference {
	return {
		route: page.route,
		title: page.title,
		summary: page.summary,
		// A page reads by its status when it has one; anything dated reads by its date.
		meta: page.inProgress
			? 'In progress'
			: (page.status ?? (page.published ? formatDate(page.published) : null)),
		href: page.route
	};
}

/** One page, named by its path. */
export function catalogEntry(route: string): CatalogReference {
	const page = byRoute.get(route);
	if (!page) throw new Error(`Unknown page "${route}" in a catalog reference.`);
	return describe(page);
}

/** The children of a directory page, newest first. */
export function catalogEntries(route: string, limit?: number): CatalogReference[] {
	const entries = childrenOf(route).map(describe);
	return limit === undefined ? entries : entries.slice(0, Math.max(0, limit));
}

/** Counts of what a visitor can currently reach, for authored prose that should never go stale. */
export function catalogCount(source: string) {
	if (source.startsWith('/')) return childrenOf(source).length;
	const counts: Record<string, number> = {
		photographs: galleryImages.length,
		essays: essayPages.length
	};
	if (!(source in counts))
		throw new Error(
			`Unknown count "${source}". Give a page path, or one of: ${Object.keys(counts).join(', ')}.`
		);
	return counts[source];
}
