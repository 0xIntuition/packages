/**
 * Wikidata EntitySchema bindings, in deterministic precedence order.
 * Normative specification: `@0xintuition/iid-spec` schemes/wd.md and §7.3.
 */
export interface WdEntitySchemaBinding {
	readonly slug: string;
	readonly entitySchemaId: `E${number}`;
	readonly anchorQids: readonly `Q${number}`[];
	readonly classification:
		| 'Movie'
		| 'TVSeries'
		| 'TVSeason'
		| 'TVEpisode'
		| 'Book'
		| 'Person'
		| 'PodcastSeries'
		| 'PodcastEpisode'
		| 'VideoGame'
		| 'MusicAlbum'
		| 'Organization';
	readonly status: 'active' | 'dormant';
	readonly precedence: number;
	/** Pinned EntitySchema revision (harvest 2026-08-20, schemas.jsonl.gz sha256 8ed2b586…). */
	readonly schemaRevId: number;
}

const WD_ENTITYSCHEMA_BINDING_ROWS = [
	{
		slug: 'film',
		entitySchemaId: 'E11424',
		anchorQids: ['Q11424'],
		classification: 'Movie',
		status: 'active',
		precedence: 0,
		schemaRevId: 2403158147,
	},
	{
		slug: 'television-series',
		entitySchemaId: 'E17',
		anchorQids: ['Q5398426'],
		classification: 'TVSeries',
		status: 'active',
		precedence: 1,
		schemaRevId: 2525771900,
	},
	{
		slug: 'television-series-season',
		entitySchemaId: 'E18',
		anchorQids: ['Q3464665'],
		classification: 'TVSeason',
		status: 'dormant',
		precedence: 2,
		schemaRevId: 2525772131,
	},
	{
		slug: 'television-series-episode',
		entitySchemaId: 'E19',
		anchorQids: ['Q21191270'],
		classification: 'TVEpisode',
		status: 'dormant',
		precedence: 3,
		schemaRevId: 2279362550,
	},
	{
		slug: 'written-work',
		entitySchemaId: 'E35',
		anchorQids: ['Q47461344'],
		classification: 'Book',
		status: 'dormant',
		precedence: 4,
		schemaRevId: 2525775487,
	},
	{
		slug: 'human',
		entitySchemaId: 'E10',
		anchorQids: ['Q5'],
		classification: 'Person',
		status: 'active',
		precedence: 5,
		schemaRevId: 2499173058,
	},
	{
		slug: 'podcast',
		entitySchemaId: 'E418',
		anchorQids: ['Q24634210'],
		classification: 'PodcastSeries',
		status: 'dormant',
		precedence: 6,
		schemaRevId: 2052853948,
	},
	{
		slug: 'podcast-episode',
		entitySchemaId: 'E420',
		anchorQids: ['Q61855877'],
		classification: 'PodcastEpisode',
		status: 'dormant',
		precedence: 7,
		schemaRevId: 2212603393,
	},
	{
		slug: 'video-game',
		entitySchemaId: 'E272',
		anchorQids: ['Q7889'],
		classification: 'VideoGame',
		status: 'dormant',
		precedence: 8,
		schemaRevId: 2363080401,
	},
	{
		slug: 'album',
		entitySchemaId: 'E248',
		anchorQids: ['Q482994'],
		classification: 'MusicAlbum',
		status: 'dormant',
		precedence: 9,
		schemaRevId: 2226920960,
	},
	{
		slug: 'organization',
		entitySchemaId: 'E98',
		anchorQids: ['Q43229'],
		classification: 'Organization',
		status: 'dormant',
		precedence: 10,
		schemaRevId: 2392901167,
	},
] as const satisfies readonly WdEntitySchemaBinding[];

/**
 * Deep-frozen at module load: the table, every row and every `anchorQids`
 * list, so consumers read pinned data and any mutation throws in strict
 * mode. The intuition-v2 source leaves these mutable; this is a deliberate
 * hardening of the published package.
 */
function deepFreezeBindings<T extends readonly WdEntitySchemaBinding[]>(rows: T): T {
	for (const row of rows) {
		Object.freeze(row.anchorQids);
		Object.freeze(row);
	}
	Object.freeze(rows);
	return rows;
}

export const WD_ENTITYSCHEMA_BINDINGS = deepFreezeBindings(WD_ENTITYSCHEMA_BINDING_ROWS);

export type WdEntitySchemaSlug = (typeof WD_ENTITYSCHEMA_BINDINGS)[number]['slug'];

/**
 * Full grammar set, including ratified-but-dormant bindings.
 */
export const WD_ENTITYSCHEMA_SLUGS: readonly WdEntitySchemaSlug[] = Object.freeze(
	WD_ENTITYSCHEMA_BINDINGS.map(({ slug }) => slug)
);

const WD_ENTITYSCHEMA_SLUG_SET: ReadonlySet<string> = new Set(WD_ENTITYSCHEMA_SLUGS);
const WD_ACTIVE_ENTITYSCHEMA_SLUG_SET: ReadonlySet<string> = new Set(
	WD_ENTITYSCHEMA_BINDINGS.filter(({ status }) => status === 'active').map(({ slug }) => slug)
);

/**
 * Runtime membership check backed by a module-private, immutable allowlist.
 */
export function isWdEntitySchemaSlug(slug: string): slug is WdEntitySchemaSlug {
	return WD_ENTITYSCHEMA_SLUG_SET.has(slug);
}

/**
 * Runtime minting check for the Wave-1 active binding set.
 */
export function isActiveWdEntitySchemaSlug(slug: string): slug is WdEntitySchemaSlug {
	return WD_ACTIVE_ENTITYSCHEMA_SLUG_SET.has(slug);
}
