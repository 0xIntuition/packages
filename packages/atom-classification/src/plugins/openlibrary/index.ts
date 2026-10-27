import { slugify, toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';

type OpenLibrarySubtype = 'work' | 'book';

type OpenLibraryTarget = {
	subtype: OpenLibrarySubtype;
	olid: string;
	canonicalUrl: string;
};

export type OpenLibraryPluginOptions = PlatformV0PluginOptions;

export const openLibraryProfile: PlatformV0Profile = {
	domain: 'openlibrary',
	display: {
		classificationSlugs: ['book'],
		exampleUrl: 'https://openlibrary.org/works/OL45804W',
		host: 'openlibrary.org',
		label: 'Open Library',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'openlibrary-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseOpenLibraryUrl(input);
			if (!target) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'openlibrary',
				subtype: target.subtype,
				confidence: 0.99,
				meta: {
					...(target.subtype === 'work' ? { workOlid: target.olid } : { editionOlid: target.olid }),
					canonicalUrl: target.canonicalUrl,
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const subtype = toOpenLibrarySubtype(classification.subtype) ?? 'book';
		const olid =
			toStringMaybe(
				subtype === 'work' ? classification.meta.workOlid : classification.meta.editionOlid
			) ?? slugify(canonicalUrl);
		const label = subtype === 'work' ? 'OpenLibrary Work' : 'OpenLibrary Book';
		const name = `${label} ${olid}`.trim();
		const canonicalId = `openlibrary:${subtype}:${olid}`;

		return withPlatformMetadata(
			{
				schemaType: 'Book',
				category: 'thing',
				title: name,
				canonicalId,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'Book',
					name,
					identifier: canonicalId,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'openlibrary',
			classification.subtype,
			{
				pluginId: 'openlibrary',
				provider: 'openlibrary',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createOpenLibraryPlugin(options: OpenLibraryPluginOptions = {}) {
	return createPlatformPlugin({
		pluginId: 'openlibrary',
		resolverId: 'openlibrary-resolver',
		profile: openLibraryProfile,
		options,
	});
}

function parseOpenLibraryUrl(input: string): OpenLibraryTarget | undefined {
	const parsed = tryParseUrl(input);
	if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
		return undefined;
	}

	const host = parsed.hostname.toLowerCase();
	if (host !== 'openlibrary.org' && host !== 'www.openlibrary.org') {
		return undefined;
	}

	const workMatch = parsed.pathname.match(/^\/works\/(OL\d+W)(?:\/[^/]+)?\/?$/i);
	if (workMatch?.[1]) {
		const olid = workMatch[1].toUpperCase();
		return {
			subtype: 'work',
			olid,
			canonicalUrl: `https://openlibrary.org/works/${olid}`,
		};
	}

	const bookMatch = parsed.pathname.match(/^\/books\/(OL\d+M)(?:\/[^/]+)?\/?$/i);
	if (bookMatch?.[1]) {
		const olid = bookMatch[1].toUpperCase();
		return {
			subtype: 'book',
			olid,
			canonicalUrl: `https://openlibrary.org/books/${olid}`,
		};
	}

	return undefined;
}

function toOpenLibrarySubtype(value: string): OpenLibrarySubtype | undefined {
	return value === 'work' || value === 'book' ? value : undefined;
}
