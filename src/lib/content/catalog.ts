import { site } from '$lib/data/site';
import catalogData from '../../content/catalog.json';

export interface ProjectEntry {
	title: string;
	slug: string;
	summary: string | null;
	status: string | null;
	featured: boolean;
	tags: string[];
	links: {
		paper: string | null;
		code: string | null;
		docs: string | null;
		demo: string | null;
	};
	draft: boolean;
}

export interface WritingEntry {
	title: string;
	slug: string;
	summary: string;
	published: string;
	updated?: string;
	tags: string[];
	relatedProjects: string[];
	featured: boolean;
	draft: boolean;
	cover: string | null;
	body: string[];
}

export interface PhotoEssayEntry {
	title: string;
	slug: string;
	summary: string;
	published: string;
	location: string | null;
	cover: string;
	featured: boolean;
	draft: boolean;
	body: string[];
	images: GalleryImage[];
}

export interface GalleryImage {
	src: string;
	alt: string;
	caption: string | null;
	context?: string[];
	width: number;
	height: number;
	location?: string;
	date?: string;
	decorative?: boolean;
}

const rawCatalog = catalogData as unknown as {
	projects: ProjectEntry[];
	writing: WritingEntry[];
	photoEssays: PhotoEssayEntry[];
	galleryImages: GalleryImage[];
};

export const projects = rawCatalog.projects;
export const writingEntries = rawCatalog.writing;
export const photoEssays = rawCatalog.photoEssays;
export const galleryImages = rawCatalog.galleryImages;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function assertNonEmptyString(value: unknown, context: string): asserts value is string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new Error(`${context}: expected a non-empty string.`);
	}
}

function assertStringArray(value: unknown, context: string): asserts value is string[] {
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
		throw new Error(`${context}: expected an array of non-empty strings.`);
	}
}

function assertUniqueSlugs(entries: Array<{ slug: string }>, collection: string) {
	const seen = new Set<string>();

	for (const entry of entries) {
		assertNonEmptyString(entry.slug, `${collection} slug`);
		if (!slugPattern.test(entry.slug)) {
			throw new Error(`${collection}: invalid lowercase slug "${entry.slug}".`);
		}

		if (seen.has(entry.slug)) {
			throw new Error(`${collection}: duplicate slug "${entry.slug}".`);
		}

		seen.add(entry.slug);
	}
}

function assertDate(value: string, context: string) {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (
		!datePattern.test(value) ||
		Number.isNaN(parsed.getTime()) ||
		parsed.toISOString().slice(0, 10) !== value
	) {
		throw new Error(`${context}: invalid ISO date "${value}".`);
	}
}

function assertExternalUrl(value: string, context: string) {
	const url = new URL(value);
	if (url.protocol !== 'https:' && url.protocol !== 'http:') {
		throw new Error(`${context}: URL must use http or https.`);
	}
}

function validateImage(image: GalleryImage, context: string) {
	assertNonEmptyString(image.src, `${context} src`);
	if (typeof image.alt !== 'string') {
		throw new Error(`${context}: image "${image.src}" requires an alt field.`);
	}
	if (image.decorative !== undefined && typeof image.decorative !== 'boolean') {
		throw new Error(`${context}: image "${image.src}" decorative must be a boolean.`);
	}
	if (image.caption !== null && typeof image.caption !== 'string') {
		throw new Error(`${context}: image "${image.src}" caption must be a string or null.`);
	}
	if (image.context !== undefined) {
		assertStringArray(image.context, `${context} image "${image.src}" context`);
	}
	if (!image.src.startsWith('/images/')) {
		throw new Error(`${context}: image source "${image.src}" must use an /images/ path.`);
	}
	if (
		typeof image.width !== 'number' ||
		typeof image.height !== 'number' ||
		!Number.isInteger(image.width) ||
		!Number.isInteger(image.height) ||
		image.width <= 0 ||
		image.height <= 0
	) {
		throw new Error(`${context}: image "${image.src}" requires positive intrinsic dimensions.`);
	}
	if (!image.decorative && !image.alt.trim()) {
		throw new Error(`${context}: meaningful image "${image.src}" requires alternative text.`);
	}
	if (image.location !== undefined) assertNonEmptyString(image.location, `${context} location`);
	if (image.date !== undefined) assertDate(image.date, `${context} date`);
}

function validateCatalog() {
	if (![projects, writingEntries, photoEssays, galleryImages].every(Array.isArray)) {
		throw new Error('Content catalog collections must be arrays.');
	}

	assertUniqueSlugs(projects, 'projects');
	assertUniqueSlugs(writingEntries, 'writing');
	assertUniqueSlugs(photoEssays, 'photo essays');

	const projectSlugs = new Set(projects.map((project) => project.slug));

	for (const project of projects) {
		assertNonEmptyString(project.title, `projects/${project.slug} title`);
		assertStringArray(project.tags, `projects/${project.slug} tags`);
		if (typeof project.featured !== 'boolean' || typeof project.draft !== 'boolean') {
			throw new Error(`projects/${project.slug}: featured and draft must be booleans.`);
		}
		if (!project.links || typeof project.links !== 'object') {
			throw new Error(`projects/${project.slug}: links must be an object.`);
		}
		for (const [field, value] of [
			['summary', project.summary],
			['status', project.status]
		] as const) {
			if (value !== null && typeof value !== 'string') {
				throw new Error(`projects/${project.slug} ${field}: expected a string or null.`);
			}
		}
		if (!project.draft && (!project.summary?.trim() || !project.status?.trim())) {
			throw new Error(`projects/${project.slug}: published projects require summary and status.`);
		}

		for (const [kind, value] of Object.entries(project.links)) {
			if (value !== null) {
				assertNonEmptyString(value, `projects/${project.slug} links.${kind}`);
				assertExternalUrl(value, `projects/${project.slug} links.${kind}`);
			}
		}
	}

	for (const entry of writingEntries) {
		assertNonEmptyString(entry.title, `writing/${entry.slug} title`);
		assertNonEmptyString(entry.summary, `writing/${entry.slug} summary`);
		assertStringArray(entry.tags, `writing/${entry.slug} tags`);
		assertStringArray(entry.relatedProjects, `writing/${entry.slug} relatedProjects`);
		assertStringArray(entry.body, `writing/${entry.slug} body`);
		if (typeof entry.featured !== 'boolean' || typeof entry.draft !== 'boolean') {
			throw new Error(`writing/${entry.slug}: featured and draft must be booleans.`);
		}
		if (entry.cover !== null && typeof entry.cover !== 'string') {
			throw new Error(`writing/${entry.slug}: cover must be a string or null.`);
		}
		assertDate(entry.published, `writing/${entry.slug} published`);
		if (entry.updated) assertDate(entry.updated, `writing/${entry.slug} updated`);
		if (!entry.draft && entry.body.length === 0) {
			throw new Error(`writing/${entry.slug}: published entries require body content.`);
		}
		if (entry.cover && !entry.cover.startsWith('/images/')) {
			throw new Error(`writing/${entry.slug}: cover must use an /images/ path.`);
		}

		for (const projectSlug of entry.relatedProjects) {
			if (!projectSlugs.has(projectSlug)) {
				throw new Error(`writing/${entry.slug}: unknown related project "${projectSlug}".`);
			}
		}
	}

	for (const essay of photoEssays) {
		assertNonEmptyString(essay.title, `photo-essays/${essay.slug} title`);
		assertNonEmptyString(essay.summary, `photo-essays/${essay.slug} summary`);
		assertStringArray(essay.body, `photo-essays/${essay.slug} body`);
		if (typeof essay.featured !== 'boolean' || typeof essay.draft !== 'boolean') {
			throw new Error(`photo-essays/${essay.slug}: featured and draft must be booleans.`);
		}
		if (!Array.isArray(essay.images)) {
			throw new Error(`photo-essays/${essay.slug}: images must be an array.`);
		}
		assertDate(essay.published, `photo-essays/${essay.slug} published`);
		assertNonEmptyString(essay.cover, `photo-essays/${essay.slug} cover`);
		if (!essay.cover.startsWith('/images/')) {
			throw new Error(`photo-essays/${essay.slug}: cover must use an /images/ path.`);
		}
		if (!essay.draft && essay.images.length === 0) {
			throw new Error(`photo-essays/${essay.slug}: published essays require at least one image.`);
		}
		for (const image of essay.images) validateImage(image, `photo-essays/${essay.slug}`);
	}

	for (const image of galleryImages) validateImage(image, 'gallery');

	if (site.indexable) {
		if (projects.some((project) => project.featured && project.draft)) {
			throw new Error(
				'Launch guard: featured projects must not remain drafts when indexing is enabled.'
			);
		}
		if (!writingEntries.some((entry) => !entry.draft)) {
			throw new Error('Launch guard: Writing requires at least one published entry.');
		}
		if (galleryImages.length === 0 && !photoEssays.some((essay) => !essay.draft)) {
			throw new Error(
				'Launch guard: Photography requires an approved gallery image or published photo essay.'
			);
		}
	}
}

validateCatalog();

export const publishedWritingEntries = writingEntries.filter((entry) => !entry.draft);
export const publishedPhotoEssays = photoEssays.filter((essay) => !essay.draft);

export function getProject(slug: string) {
	const project = projects.find((entry) => entry.slug === slug);
	if (!project) throw new Error(`Unknown project "${slug}".`);
	return project;
}

export function getPublishedWritingForProject(projectSlug: string) {
	return publishedWritingEntries
		.filter((entry) => entry.relatedProjects.includes(projectSlug))
		.toSorted((a, b) => b.published.localeCompare(a.published));
}
