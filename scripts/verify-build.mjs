import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import catalog from '../src/content/catalog.json' with { type: 'json' };
import routeDefinitions from '../src/lib/data/routes.json' with { type: 'json' };

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDirectory = path.join(projectRoot, 'build');

async function firstExistingPath(candidates) {
	for (const candidate of candidates) {
		try {
			await access(candidate);
			return candidate;
		} catch {
			// Try the next valid adapter-static output shape.
		}
	}

	return null;
}

function outputCandidates(routePath) {
	if (routePath === '/') return [path.join(buildDirectory, 'index.html')];
	if (routePath === '/404') return [path.join(buildDirectory, '404.html')];

	const relativePath = routePath.slice(1);
	return [
		path.join(buildDirectory, `${relativePath}.html`),
		path.join(buildDirectory, relativePath, 'index.html')
	];
}

function countMatches(value, expression) {
	return [...value.matchAll(expression)].length;
}

const contentRoutes = [
	...catalog.writing
		.filter((entry) => !entry.draft)
		.map((entry) => ({ path: `/writing/${entry.slug}`, sitemap: true })),
	...catalog.photoEssays
		.filter((essay) => !essay.draft)
		.map((essay) => ({ path: `/photography/essays/${essay.slug}`, sitemap: true }))
];
const expectedRoutes = [...routeDefinitions, ...contentRoutes];
const builtPages = new Map();

for (const requiredAsset of ['404.html', 'robots.txt', 'sitemap.xml', '_headers']) {
	await access(path.join(buildDirectory, requiredAsset));
}

const robots = await readFile(path.join(buildDirectory, 'robots.txt'), 'utf8');
const isPrototype = robots.includes('Disallow: /');
if (!isPrototype && !robots.includes('Allow: /')) {
	throw new Error(
		'robots.txt must either block the prototype or explicitly allow the launch site.'
	);
}

for (const route of expectedRoutes) {
	const outputPath = await firstExistingPath(outputCandidates(route.path));
	if (!outputPath) {
		throw new Error(`Static output is missing for ${route.path}.`);
	}

	const html = await readFile(outputPath, 'utf8');
	builtPages.set(route.path, html);

	if (!/<html\b[^>]*\blang="en"/i.test(html)) {
		throw new Error(`${route.path}: missing English document language.`);
	}
	if (!/<title>[^<]+<\/title>/i.test(html)) {
		throw new Error(`${route.path}: missing a page title.`);
	}
	if (!/<meta\b[^>]*name="description"[^>]*content="[^"]+"/i.test(html)) {
		throw new Error(`${route.path}: missing a meta description.`);
	}
	if (!/<link\b[^>]*rel="canonical"[^>]*href="https:\/\/nebve\.com/i.test(html)) {
		throw new Error(`${route.path}: missing a nebve.com canonical URL.`);
	}
	if (countMatches(html, /<h1\b/gi) !== 1) {
		throw new Error(`${route.path}: expected exactly one h1.`);
	}
	const expectedRobots =
		isPrototype || route.path === '/404' ? 'noindex, nofollow' : 'index, follow';
	if (!new RegExp(`<meta\\b[^>]*name="robots"[^>]*content="${expectedRobots}"`, 'i').test(html)) {
		throw new Error(`${route.path}: robots metadata does not match the current release state.`);
	}
	if (/<script\b/i.test(html)) {
		throw new Error(
			`${route.path}: the non-interactive prototype should not ship hydration scripts.`
		);
	}
	if (!isPrototype && /data-(?:editorial-placeholder|draft-only)(?:[\s=>])/i.test(html)) {
		throw new Error(
			`${route.path}: launch output still contains an editorial placeholder or draft-only surface.`
		);
	}
}

const knownRoutes = new Set(expectedRoutes.map((route) => route.path));

for (const [routePath, html] of builtPages) {
	const routeUrl = new URL(routePath, 'https://nebve.com');
	for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
		const href = match[1].replaceAll('&amp;', '&');
		if (href.startsWith('#')) continue;

		const target = new URL(href, routeUrl);
		if (target.origin !== routeUrl.origin) continue;

		const linkPath = target.pathname.replace(/\/$/, '') || '/';
		if (!knownRoutes.has(linkPath)) {
			throw new Error(`${routePath}: internal link points to an unknown route (${linkPath}).`);
		}
	}
}

const sitemap = await readFile(path.join(buildDirectory, 'sitemap.xml'), 'utf8');
for (const route of expectedRoutes.filter((entry) => entry.sitemap)) {
	const canonical = new URL(route.path, 'https://nebve.com').toString();
	if (isPrototype && sitemap.includes(`<loc>${canonical}</loc>`)) {
		throw new Error('Prototype sitemap must not expose public page entries.');
	}
	if (!isPrototype && !sitemap.includes(`<loc>${canonical}</loc>`)) {
		throw new Error(`Launch sitemap is missing ${canonical}.`);
	}
}

console.log(
	`Verified ${builtPages.size} prerendered pages and ${isPrototype ? 'prototype' : 'launch'} release guards.`
);
