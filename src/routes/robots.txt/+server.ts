import { site } from '$lib/data/site';

export const prerender = true;

export function GET() {
	const rules = site.indexable
		? `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`
		: 'User-agent: *\nDisallow: /\n';

	return new Response(rules, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
}
