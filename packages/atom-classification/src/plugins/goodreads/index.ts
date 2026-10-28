import type { ClassificationResult } from '../../types';
import { slugify, toStringMaybe, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';
import {
	createGoodreadsOpenLibraryAdapter,
	type GoodreadsOpenLibraryAdapterOptions,
	takeGoodreadsOpenLibraryCandidates,
} from './openlibrary-adapter';
import { parseGoodreadsBookUrl } from './url';

export type GoodreadsPluginOptions = PlatformV0PluginOptions & {
	openLibrary?: GoodreadsOpenLibraryAdapterOptions;
	/** @deprecated Goodreads page fetching is not installed by the default plugin. */
	useDefaultOpenGraphAdapter?: boolean;
	useDefaultOpenLibraryAdapter?: boolean;
};

export const GOODREADS_BLOCKED_MESSAGE = 'Goodreads is blocking us; try the OpenLibrary link';

export type GoodreadsBlockedOutcome = {
	code: 'goodreads_source_blocked';
	message: typeof GOODREADS_BLOCKED_MESSAGE;
	provider: 'goodreads';
	retryable: false;
};

/** @deprecated Goodreads resolution is URL-only and never emits a blocked outcome. */
export function resolveGoodreadsBlockedOutcome(_input: {
	classification: ClassificationResult;
	rawInput: string;
}): GoodreadsBlockedOutcome | undefined {
	return undefined;
}

export const goodreadsProfile: PlatformV0Profile = {
	domain: 'goodreads',
	display: {
		classificationSlugs: ['book'],
		exampleUrl: 'https://www.goodreads.com/book/show/4671',
		host: 'goodreads.com',
		label: 'Goodreads',
	},
	supportsOEmbed: false,
	allowDomainApiWithoutCredentials: true,
	classifier: {
		id: 'goodreads-url-classifier',
		priority: 10,
		classify(input: string) {
			const parsed = parseGoodreadsBookUrl(input);
			if (!parsed) {
				return null;
			}
			const slugTitle = deriveSlugTitle(parsed.slug);

			return {
				type: 'url' as const,
				domain: 'goodreads',
				subtype: 'book',
				confidence: 0.99,
				meta: {
					bookId: parsed.bookId,
					canonicalUrl: parsed.canonicalUrl,
					...(slugTitle ? { slugTitle } : {}),
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const bookId = toStringMaybe(classification.meta.bookId) ?? slugify(canonicalUrl);
		const name = toStringMaybe(classification.meta.slugTitle) ?? `Goodreads Book ${bookId}`;

		const candidates = takeGoodreadsOpenLibraryCandidates(classification);
		const atom = withPlatformMetadata(
			{
				schemaType: 'Book',
				category: 'thing',
				title: name,
				canonicalId: `goodreads:book:${bookId}`,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'Book',
					name,
					identifier: bookId,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'goodreads',
			'book',
			{
				pluginId: 'goodreads',
				provider: 'goodreads',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
		return candidates
			? { ...atom, metadata: { ...atom.metadata, openLibraryCandidates: candidates } }
			: atom;
	},
};

function deriveSlugTitle(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	let decoded: string;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		return undefined;
	}

	// User-visible titles are bounded by Unicode code points, not UTF-16 code
	// units, so astral characters count once toward the 200-character limit.
	if (Array.from(decoded).length > 200 || hasUnsafeTitleCharacter(decoded)) {
		return undefined;
	}

	const normalized = decoded.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
	if (!normalized || /^\d+$/.test(normalized)) {
		return undefined;
	}

	if (normalized !== normalized.toLowerCase()) {
		return normalized;
	}

	return normalized.replace(/\S+/g, (word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`);
}

function hasUnsafeTitleCharacter(value: string): boolean {
	for (const character of value) {
		const codePoint = character.codePointAt(0) ?? 0;
		if (
			codePoint <= 0x1f ||
			(codePoint >= 0x7f && codePoint <= 0x9f) ||
			codePoint === 0x061c ||
			codePoint === 0x200e ||
			codePoint === 0x200f ||
			(codePoint >= 0x202a && codePoint <= 0x202e) ||
			(codePoint >= 0x2066 && codePoint <= 0x2069) ||
			codePoint === 0xfeff ||
			character === '<' ||
			character === '>'
		) {
			return true;
		}
	}

	return false;
}

export function createGoodreadsPlugin(options: GoodreadsPluginOptions = {}) {
	const {
		openLibrary,
		useDefaultOpenGraphAdapter: _useDefaultOpenGraphAdapter,
		useDefaultOpenLibraryAdapter = true,
		...platformOptions
	} = options;
	const domainApiAdapter =
		platformOptions.adapters?.domainApi ??
		(useDefaultOpenLibraryAdapter
			? createGoodreadsOpenLibraryAdapter({
					...openLibrary,
					firstStageWaitMs: Number.POSITIVE_INFINITY,
				})
			: undefined);

	return createPlatformPlugin({
		pluginId: 'goodreads',
		resolverId: 'goodreads-resolver',
		profile: goodreadsProfile,
		options: {
			...platformOptions,
			adapters: {
				...platformOptions.adapters,
				domainApi: domainApiAdapter,
			},
		},
	});
}
