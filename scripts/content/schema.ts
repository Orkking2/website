import { z } from 'zod';

export const slugSchema = z
	.string()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase hyphenated slug.');
/**
 * A name an essay gives one of its own photographs.
 *
 * It has to start with a letter so the order you write the images in is the order
 * they keep, and so it can be used directly as a link target within the essay.
 */
export const aliasSchema = z
	.string()
	.regex(
		/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
		'Use a lowercase hyphenated name that starts with a letter.'
	);
const text = z.string().trim().min(1, 'Supply a non-empty value.');
export const dateSchema = z.string().refine((value) => {
	const date = new Date(`${value}T00:00:00Z`);
	return (
		/^\d{4}-\d{2}-\d{2}$/.test(value) &&
		!Number.isNaN(+date) &&
		date.toISOString().slice(0, 10) === value
	);
}, 'Use a real calendar date, YYYY-MM-DD.');
const localTime = z.string().refine((value) => {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) return false;
	const normalized = value.length === 16 ? `${value}:00` : value;
	const date = new Date(`${normalized}Z`);
	return !Number.isNaN(+date) && date.toISOString().slice(0, 19) === normalized;
}, 'Use a real local capture date and time, without an assumed timezone.');
const offset = z
	.string()
	.regex(/^[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00)$/, 'Use a UTC offset between -14:00 and +14:00.');
const externalUrl = z.url().refine((value) => {
	const url = new URL(value);
	return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
}, 'Use an HTTP(S) URL without credentials.');
const imagePath = z
	.string()
	.regex(/^\/images\/[a-zA-Z0-9/_\-.]+$/)
	.refine((value) => !value.includes('..'), 'Image paths must stay inside /images/.');
/** A site path, as authored: "/", "/writing", "/photography/worn-with-time". */
export const routeSchema = z
	.string()
	.regex(
		/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/,
		'Use a site path built from lowercase hyphenated segments, as "/photography/worn-with-time".'
	);

/**
 * The shell a page is rendered in.
 *
 * Every page is the same kind of thing — a Markdown file somewhere in the tree —
 * so this chooses a presentation, not a type. An essay's trailing photographs and
 * an article's annotation rail follow from the frontmatter that asks for them,
 * not from where the file happens to sit.
 */
export const layouts = ['home', 'page'] as const;

/**
 * One schema for every page, with every facet optional.
 *
 * A key that is present but empty is unfinished and reported by
 * completenessIssues; a key that is absent simply does not apply to this page.
 * That distinction is the whole type system: a page with `published:` is dated,
 * a page with `images:` is a photo essay, a page with `links:` has resources.
 */
export const pageSchema = z.strictObject({
	title: text,
	summary: text.nullable(),
	/** The small label above the heading. Defaults to the parent page's title. */
	eyebrow: text.nullable().default(null),
	/** The h1, when the page opens with a sentence rather than its own name. */
	headline: text.nullable().default(null),
	layout: z.enum(layouts).default('page'),
	/** Sorts this page against its siblings, in the header and in <Entries>. */
	order: z.number().int().optional(),
	/** Whether the header links to this page. Top-level pages are listed by default. */
	nav: z.boolean().optional(),
	/** Whether search engines and the sitemap are told about this page. */
	listed: z.boolean().default(true),
	published: dateSchema.nullable().optional(),
	updated: dateSchema.optional(),
	featured: z.boolean().default(false),
	status: text.nullable().optional(),
	tags: z.array(text).default([]),
	links: z
		.strictObject({
			paper: externalUrl.nullable(),
			code: externalUrl.nullable(),
			docs: externalUrl.nullable(),
			demo: externalUrl.nullable()
		})
		.optional(),
	/** Other pages this one develops, named by path. */
	related: z.array(routeSchema).default([]),
	annotations: z.boolean().default(false),
	location: text.nullable().optional(),
	inProgress: z.boolean().default(false),
	// A photo essay is a collection: each photograph gets a name that is local to this
	// page, so two photographs may share a title and still be addressed separately.
	// Keys are checked in parseMetadata so a bad name reports itself, not "invalid key".
	images: z.record(z.string(), slugSchema).optional(),
	/** One of this page's own photographs, or an image path for a page without them. */
	cover: z.string().nullable().optional()
});

const voiceFlagSource = /<!--\s*Voice flag:\s*([\s\S]*?)\s*-->/;
export const voiceFlagPattern = voiceFlagSource;
export function findVoiceFlags(body: string) {
	return [...body.matchAll(new RegExp(voiceFlagSource, 'g'))].map((match) => ({
		reason: match[1].replace(/\s+/g, ' '),
		line: body.slice(0, match.index).split('\n').length
	}));
}

export type PageMetadata = z.infer<typeof pageSchema>;
export type Layout = (typeof layouts)[number];
/** A page that names its own photographs. */
export type EssayMetadata = PageMetadata & { images: Record<string, string>; cover: string | null };

export function isEssay(entry: PageMetadata): entry is EssayMetadata {
	return 'images' in entry;
}

export function parseMetadata(raw: unknown, file: string): PageMetadata {
	const result = pageSchema.safeParse(raw);
	if (!result.success) {
		throw new Error(
			result.error.issues
				.map((issue) => `${file} → ${issue.path.join('.') || 'frontmatter'}: ${issue.message}`)
				.join('\n')
		);
	}
	const entry = result.data;
	if (entry.updated && (!entry.published || entry.updated < entry.published)) {
		throw new Error(`${file} → updated: A substantive revision cannot precede first publication.`);
	}
	for (const field of ['tags', 'related'] as const) {
		const values = entry[field];
		if (new Set(values).size !== values.length)
			throw new Error(`${file} → ${field}: Remove duplicate entries.`);
	}
	if (isEssay(entry)) {
		for (const alias of Object.keys(entry.images)) {
			const named = aliasSchema.safeParse(alias);
			if (!named.success)
				throw new Error(`${file} → images.${alias}: ${named.error.issues[0].message}`);
		}
		const ids = Object.values(entry.images);
		if (new Set(ids).size !== ids.length)
			throw new Error(`${file} → images: Give each photograph one name on this page.`);
	} else if (entry.cover) {
		// Without its own photographs, a cover can only be a built image path.
		const cover = imagePath.safeParse(entry.cover);
		if (!cover.success)
			throw new Error(
				`${file} → cover: Name one of this page's own photographs, or give an /images/ path.`
			);
	}
	return entry;
}

/**
 * What is still missing before this page can be served.
 *
 * Completeness is computed, never declared. An unfinished file is reported as a
 * warning while you work and refuses to build, so nothing you push is half-written
 * and nothing asks you to flag your own intent.
 *
 * A facet is only required once the page has asked for it: `published:` left empty
 * is an unfinished date, while no `published:` key at all is a page that is not dated.
 */
export function completenessIssues(entry: PageMetadata, body: string): string[] {
	const issues: string[] = [];
	if (!entry.summary) issues.push('summary: Write the one-sentence orientation.');
	if (!body.trim()) issues.push('body: Write the text.');
	if ('published' in entry && !entry.published)
		issues.push('published: Supply the first-publication date.');
	if ('status' in entry && !entry.status) issues.push('status: Supply a project status.');
	if (isEssay(entry)) {
		if (!Object.keys(entry.images).length) issues.push('images: Name at least one photograph.');
		else if (!entry.cover || !(entry.cover in entry.images))
			issues.push("cover: Name one of this page's own photographs.");
	}
	for (const flag of findVoiceFlags(body))
		issues.push(`body:${flag.line}: Resolve the open Voice flag — ${flag.reason}`);
	return issues;
}

/** The name a photograph carries when it has not been given one. */
export const UNTITLED = 'Untitled';

export const photoSchema = z.strictObject({
	schemaVersion: z.literal(1),
	id: slugSchema,
	asset: z.strictObject({
		master: z.string(),
		// JPEG is retained for older, bounded masters until reimported from the source.
		format: z.enum(['jpeg', 'webp']),
		width: z.number().int().positive(),
		height: z.number().int().positive(),
		colorSpace: z.literal('sRGB'),
		orientation: z.literal(1)
	}),
	title: text.nullable(),
	caption: z.string().nullable(),
	alt: z.string().nullable(),
	decorative: z.boolean(),
	/**
	 * Whether this photograph is finished and may be served.
	 *
	 * The one stage between putting a file in the library and publishing it. A
	 * photograph is unfinished while this is false or while its data is
	 * incomplete, and an unfinished photograph is simply not served — it is not
	 * an error, because a library is expected to hold work in progress.
	 */
	reviewed: z.boolean().default(false),
	captured: z.strictObject({
		local: localTime,
		offset: offset.nullable(),
		precision: z.enum(['minute', 'second'])
	}),
	location: text.nullable(),
	coordinates: z
		.strictObject({
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180)
		})
		.optional(),
	gallery: z.strictObject({ included: z.boolean() })
	// Which essay a photograph belongs to is not stored here. The essay's own
	// images map is the single source of truth, and this direction is derived
	// from it, so there is one place to change and nothing to keep in step.
});
export type PhotoRecord = z.infer<typeof photoSchema>;

/** A photograph's name, falling back to Untitled so a missing title never blocks it. */
export function titleOf(photo: Pick<PhotoRecord, 'title'>) {
	return photo.title?.trim() || UNTITLED;
}

export function parsePhoto(raw: unknown, file: string): PhotoRecord {
	const result = photoSchema.safeParse(raw);
	if (!result.success)
		throw new Error(
			result.error.issues
				.map((issue) => `${file} → ${issue.path.join('.')}: ${issue.message}`)
				.join('\n')
		);
	const photo = result.data;
	const extension = photo.asset.format === 'webp' ? 'webp' : 'jpg';
	if (photo.asset.master !== `../masters/${photo.id}.${extension}`)
		throw new Error(`${file} → asset.master: Use ../masters/${photo.id}.${extension}.`);
	if (photo.decorative && photo.alt)
		throw new Error(`${file} → alt: A decorative image must have empty alternative text.`);
	return photo;
}

/** What is still missing before this photograph can be served. See completenessIssues. */
export function photoIssues(photo: PhotoRecord): string[] {
	// Alternative text is what a screen reader has instead of the photograph. It is the
	// one thing about an image that cannot be left to taste.
	if (!photo.decorative && !photo.alt?.trim())
		return ['alt: Write alternative text, or mark the image decorative.'];
	return [];
}

/**
 * Whether this photograph is finished enough to serve.
 *
 * Unfinished covers both halves of the one stage before publication: a
 * photograph you have not marked reviewed, and one whose data is still
 * incomplete. Neither is an error — the library holds work in progress — so an
 * unfinished photograph is left out of the site rather than failing the build.
 * Claiming a photograph is reviewed while its data is incomplete *is* reported,
 * because that is a statement about it that is not true.
 */
export function isReady(photo: PhotoRecord) {
	return photo.reviewed && photoIssues(photo).length === 0;
}

export interface GalleryImage {
	id: string;
	src: string;
	fallbackSrc: string;
	srcset: string;
	webpSrcset: string;
	download?: { src: string; bytes: number; width: number; height: number };
	title: string;
	alt: string;
	caption: string | null;
	width: number;
	height: number;
	location: string | null;
	capturedAt: string;
	capturedOffset: string | null;
	coordinates?: PhotoRecord['coordinates'];
	decorative: boolean;
	photoEssay: string | null;
}

/** A photograph as one essay refers to it: its own name, plus the image itself. */
export type EssayImage = GalleryImage & { alias: string; placed: boolean };

/**
 * A page as the catalog holds it: its own frontmatter, where it sits in the tree,
 * and — for a page that names photographs — those photographs resolved to images.
 */
export interface CatalogPage extends Omit<PageMetadata, 'images' | 'cover'> {
	/** The path this page is served at: "/", "/writing", "/photography/worn-with-time". */
	route: string;
	/** The route of the page one level up, or null for the root. */
	parent: string | null;
	/** The last path segment, or "" for the root. */
	name: string;
	depth: number;
	/** True when the file is an index.md, so the page may hold children. */
	directory: boolean;
	children: string[];
	images: EssayImage[];
	cover: string | null;
	/**
	 * Whether this page shows photographs, so the shell knows to carry the viewer.
	 *
	 * True for a page that names its own photographs and for one that places the
	 * gallery. Kept as a flag so a page without any photographs ships neither the
	 * dialog nor the script that drives it.
	 */
	viewer: boolean;
}

/**
 * Deal photographs into columns, each onto the shortest column so far.
 *
 * A gallery reads down the page, so the order photographs are met should follow the
 * order they were taken. Filling one column and then the next puts the whole second
 * half of the sequence beside the first. Dealing strictly left, right, left keeps the
 * order but lets one column run far ahead whenever it collects the short photographs,
 * and everything below that point reads out of step — the drift accumulates.
 *
 * Choosing the shortest column each time bounds it. A photograph goes where the
 * reader's eye is lowest, so two neighbours may swap sides, but a column can never
 * run away from the other, and the mismatch stays local instead of propagating.
 */
export function dealIntoColumns<T extends { width: number; height: number }>(
	items: T[],
	columns: number
) {
	// A caption's share of a column's width. Captions are close enough in height to one
	// another that a constant keeps the columns level without having to measure one.
	const captionAllowance = 0.12;
	const dealt: Array<Array<{ item: T; index: number }>> = Array.from(
		{ length: Math.max(1, Math.floor(columns)) },
		() => []
	);
	const heights: number[] = new Array(dealt.length).fill(0);
	items.forEach((item, index) => {
		let shortest = 0;
		// The leftmost of equal columns, so the first row fills left to right.
		for (let column = 1; column < heights.length; column += 1)
			if (heights[column] < heights[shortest]) shortest = column;
		dealt[shortest].push({ item, index });
		heights[shortest] += item.height / item.width + captionAllowance;
	});
	return dealt;
}

export function captureSortValue(photo: { capturedAt: string; capturedOffset: string | null }) {
	// Missing offsets use the recorded wall-clock value as a deterministic sort key only.
	return Date.parse(photo.capturedAt + (photo.capturedOffset || 'Z'));
}
