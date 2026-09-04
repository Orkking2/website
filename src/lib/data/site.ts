import type { Pathname } from '$app/types';
import routeDefinitions from './routes.json';

export const site = {
	name: 'nebve.com',
	title: 'nebve.com — Research, Writing & Photography',
	description:
		'An evolving index of technical work, writing, photography, and professional material.',
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
