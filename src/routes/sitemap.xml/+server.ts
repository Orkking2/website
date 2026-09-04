import { publicRoutePaths, site } from '$lib/data/site';
import { publishedPhotoEssays, publishedWritingEntries } from '$lib/content/catalog';

export const prerender = true;

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function GET() {
	const contentPaths = [
		...publishedWritingEntries.map((entry) => `/writing/${entry.slug}`),
		...publishedPhotoEssays.map((essay) => `/photography/essays/${essay.slug}`)
	];
	const entries = site.indexable
		? [...publicRoutePaths, ...contentPaths]
				.map((path) => `  <url><loc>${escapeXml(new URL(path, site.url).toString())}</loc></url>`)
				.join('\n')
		: '';

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

	return new Response(sitemap, {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
}
