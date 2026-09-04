import type { Pathname } from '$app/types';
import routeDefinitions from './routes.json';

export const site = {
	name: 'Nicolas',
	title: 'Nicolas — Research, Writing & Photography',
	description:
		"Nicolas's personal forum for algorithms, technical writing, photography, and professional work.",
	url: 'https://nebve.com',
	indexable: false
} as const;

export const routes = routeDefinitions.map((route) => ({
	...route,
	path: route.path as Pathname,
	href: route.path as Pathname
}));

export const navigation = routes.filter((route) => route.primary);
export const publicRoutePaths = routes.filter((route) => route.sitemap).map((route) => route.path);
