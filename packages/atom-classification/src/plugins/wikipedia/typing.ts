import type { ResolverAtom } from '../../plugins';
import type { ClassificationEntityCategory, ClassificationSourceFamily } from '../../types';
import { slugify, withPlatformMetadata } from '../shared/helpers';

export type WikipediaSchemaType =
	| 'Thing'
	| 'Person'
	| 'Place'
	| 'Book'
	| 'Organization'
	| 'Product'
	| 'Newspaper'
	| 'SoftwareApplication';

export type WikipediaTypingEvidence = {
	title?: string;
	description?: string;
	extract?: string;
	wikibaseItem?: string;
	pageUrl?: string;
	canonicalUrl?: string;
};

export type WikipediaTypeInference = {
	schemaType: WikipediaSchemaType;
	category: ClassificationEntityCategory;
	confidence: number;
	reason: string;
	evidenceSource: 'description' | 'extract' | 'title' | 'default';
	keyword?: string;
};

type WikipediaKeywordRule = {
	schemaType: WikipediaSchemaType;
	category: ClassificationEntityCategory;
	confidence: number;
	reason: string;
	keywords: readonly string[];
};

export const WIKIPEDIA_DESCRIPTION_KEYWORD_RULES: readonly WikipediaKeywordRule[] = [
	{
		schemaType: 'Newspaper',
		category: 'thing',
		confidence: 0.94,
		reason: 'wikipedia-description-newspaper',
		keywords: [
			'daily newspaper',
			'weekly newspaper',
			'online newspaper',
			'student newspaper',
			'newspaper',
			'daily coverage',
			'news aggregator',
			'news website',
			'news site',
			'news publication',
			'news outlet',
		],
	},
	{
		schemaType: 'Person',
		category: 'person',
		confidence: 0.94,
		reason: 'wikipedia-description-person',
		keywords: [
			'actor',
			'actress',
			'activist',
			'admiral',
			'architect',
			'artist',
			'astronaut',
			'athlete',
			'author',
			'baseball player',
			'basketball player',
			'biologist',
			'bishop',
			'boxer',
			'businessperson',
			'chemist',
			'chess player',
			'clergyman',
			'coach',
			'comedian',
			'composer',
			'cricketer',
			'cyclist',
			'diplomat',
			'director',
			'economist',
			'engineer',
			'fashion designer',
			'filmmaker',
			'football player',
			'footballer',
			'general',
			'goaltender',
			'guitarist',
			'historian',
			'hotelier',
			'hockey player',
			'journalist',
			'judge',
			'king',
			'lawyer',
			'mathematician',
			'model',
			'monarch',
			'musician',
			'philosopher',
			'physicist',
			'poet',
			'politician',
			'prime minister',
			'producer',
			'professor',
			'programmer',
			'queen',
			'racing driver',
			'rapper',
			'researcher',
			'restaurateur',
			'rugby player',
			'scientist',
			'shooter',
			'singer',
			'soccer player',
			'soldier',
			'songwriter',
			'sport shooter',
			'streamer',
			'swimmer',
			'tennis player',
			'television personality',
			'volleyball player',
			'wrestler',
			'writer',
			'youtuber',
		],
	},
	{
		schemaType: 'SoftwareApplication',
		category: 'software',
		confidence: 0.9,
		reason: 'wikipedia-description-software',
		keywords: [
			'software application',
			'software program',
			'software platform',
			'web browser',
			'computer program',
			'mobile app',
			'application software',
		],
	},
	{
		schemaType: 'Product',
		category: 'product',
		confidence: 0.9,
		reason: 'wikipedia-description-product',
		keywords: [
			'handheld game console',
			'home video game console',
			'unreleased video game platform',
			'video game platform',
			'video game console',
			'game console',
			'gaming handheld',
			'computer hardware',
			'consumer electronic',
			'electronic game',
			'electronic device',
			'hardware device',
			'portable media player',
			'console',
			'device',
			'toy',
			'product',
		],
	},
	{
		schemaType: 'Book',
		category: 'thing',
		confidence: 0.9,
		reason: 'wikipedia-description-book',
		keywords: [
			'holy book',
			'holy books',
			'religious book',
			'religious text',
			'religious texts',
			'sacred text',
			'sacred texts',
			'canonical text',
			'canonical texts',
			'collection of texts',
			'text by',
			'buddhist text',
			'buddhist texts',
			'islamic holy books',
			'scripture',
			'scriptures',
			'bible',
			'gospel',
			'novel',
			'book',
			'books in',
			'use of books',
			'stone tablet',
			'treatise',
			'literary work',
			'library of texts',
		],
	},
	{
		schemaType: 'Organization',
		category: 'company',
		confidence: 0.88,
		reason: 'wikipedia-description-organization',
		keywords: [
			'news agency',
			'newscast',
			'news division',
			'news organization',
			'daily vlog',
			'public broadcaster',
			'television network',
			'company',
			'corporation',
			'organization',
			'organisation',
			'institution',
			'institute',
			'university',
			'college',
			'school',
			'association',
			'foundation',
			'non-profit',
			'nonprofit',
			'publisher',
		],
	},
	{
		schemaType: 'Place',
		category: 'place',
		confidence: 0.9,
		reason: 'wikipedia-description-place',
		keywords: [
			'airport',
			'archipelago',
			'bay',
			'borough',
			'bridge',
			'building',
			'capital city',
			'castle',
			'cathedral',
			'census-designated place',
			'church',
			'city',
			'commune',
			'country',
			'county',
			'desert',
			'district',
			'forest',
			'island',
			'lake',
			'municipality',
			'mountain',
			'neighborhood',
			'neighbourhood',
			'ocean',
			'park',
			'peninsula',
			'province',
			'region',
			'river',
			'road',
			'sea',
			'square',
			'state',
			'station',
			'strait',
			'street',
			'suburb',
			'town',
			'valley',
			'village',
			'world heritage site',
		],
	},
	{
		schemaType: 'Thing',
		category: 'thing',
		confidence: 0.72,
		reason: 'wikipedia-description-currency-kept-thing',
		keywords: ['currency', 'cryptocurrency', 'coin'],
	},
] as const;

export function inferWikipediaTypeFromEvidence(
	evidence: WikipediaTypingEvidence
): WikipediaTypeInference {
	const descriptionMatch = matchKeywordRules(evidence.description);
	if (descriptionMatch) {
		return { ...descriptionMatch, evidenceSource: 'description' };
	}

	const extractMatch = matchKeywordRules(evidence.extract);
	if (extractMatch) {
		return {
			...extractMatch,
			confidence: Math.min(extractMatch.confidence, 0.86),
			evidenceSource: 'extract',
		};
	}

	const titleMatch = inferWikipediaTypeFromTitle(evidence.title);
	if (titleMatch) {
		return titleMatch;
	}

	return {
		schemaType: 'Thing',
		category: 'thing',
		confidence: 0.55,
		reason: 'wikipedia-default-thing',
		evidenceSource: 'default',
	};
}

export function buildWikipediaAtomFromEvidence(input: {
	canonicalUrl: string;
	classificationConfidence?: number;
	description?: string;
	extract?: string;
	pageUrl?: string;
	sourceFamily?: ClassificationSourceFamily;
	title?: string;
	wikibaseItem?: string;
}): ResolverAtom {
	const title = normalizeWhitespace(input.title) ?? 'Wikipedia Article';
	const pageUrl = normalizeWhitespace(input.pageUrl) ?? input.canonicalUrl;
	const wikibaseItem = normalizeWikibaseItem(input.wikibaseItem);
	const inference = inferWikipediaTypeFromEvidence({
		title,
		description: input.description,
		extract: input.extract,
		wikibaseItem,
		pageUrl,
		canonicalUrl: input.canonicalUrl,
	});
	const sameAs = dedupeStrings([
		pageUrl,
		input.canonicalUrl,
		wikibaseItem ? `https://www.wikidata.org/wiki/${wikibaseItem}` : undefined,
	]);
	const canonicalSlug =
		slugify(title) || slugify(pageUrl) || slugify(input.canonicalUrl) || 'article';
	const description = normalizeWhitespace(input.description);
	const extract = normalizeWhitespace(input.extract);
	const confidence = input.classificationConfidence
		? Math.min(input.classificationConfidence, inference.confidence)
		: inference.confidence;

	return withPlatformMetadata(
		{
			schemaType: inference.schemaType,
			category: inference.category,
			title,
			description,
			confidence,
			canonicalId: `wikipedia:${canonicalSlug}`,
			sameAs,
			data: {
				'@context': 'https://schema.org/',
				'@type': inference.schemaType,
				name: title,
				url: pageUrl,
				sameAs,
				...(description ? { description } : {}),
				...(extract ? { abstract: extract } : {}),
				...(wikibaseItem ? { identifier: wikibaseItem } : {}),
			},
			metadata: {
				wikipediaTyping: {
					schemaType: inference.schemaType,
					reason: inference.reason,
					evidenceSource: inference.evidenceSource,
					...(inference.keyword ? { keyword: inference.keyword } : {}),
				},
			},
		},
		'wikipedia',
		'article',
		{
			pluginId: 'wikipedia',
			provider: input.sourceFamily === 'domain-api' ? 'wikipedia-rest-summary' : 'wikipedia',
			sourceUrl: pageUrl,
			confidence,
			resolutionMode: input.sourceFamily ? 'enriched' : undefined,
			sourceFamily: input.sourceFamily,
		}
	);
}

function matchKeywordRules(
	value: string | undefined
): Omit<WikipediaTypeInference, 'evidenceSource'> | undefined {
	const normalized = normalizeForKeywordMatch(value);
	if (!normalized) {
		return undefined;
	}

	for (const rule of WIKIPEDIA_DESCRIPTION_KEYWORD_RULES) {
		for (const keyword of rule.keywords) {
			if (containsKeyword(normalized, keyword)) {
				return {
					schemaType: rule.schemaType,
					category: rule.category,
					confidence: rule.confidence,
					reason: rule.reason,
					keyword,
				};
			}
		}
	}

	return undefined;
}

function inferWikipediaTypeFromTitle(
	title: string | undefined
): WikipediaTypeInference | undefined {
	const normalized = normalizeForKeywordMatch(title);
	if (!normalized) {
		return undefined;
	}

	if (normalized.includes('(software)')) {
		return {
			schemaType: 'SoftwareApplication',
			category: 'software',
			confidence: 0.78,
			reason: 'wikipedia-title-parenthetical-software',
			evidenceSource: 'title',
			keyword: '(software)',
		};
	}

	if (normalized.includes('(company)') || normalized.includes('(organization)')) {
		return {
			schemaType: 'Organization',
			category: 'company',
			confidence: 0.78,
			reason: 'wikipedia-title-parenthetical-organization',
			evidenceSource: 'title',
			keyword: normalized.includes('(company)') ? '(company)' : '(organization)',
		};
	}

	if (
		normalized.includes('(city)') ||
		normalized.includes('(country)') ||
		normalized.includes('(place)')
	) {
		return {
			schemaType: 'Place',
			category: 'place',
			confidence: 0.78,
			reason: 'wikipedia-title-parenthetical-place',
			evidenceSource: 'title',
			keyword: normalized.includes('(city)')
				? '(city)'
				: normalized.includes('(country)')
					? '(country)'
					: '(place)',
		};
	}

	if (normalized.includes('(person)')) {
		return {
			schemaType: 'Person',
			category: 'person',
			confidence: 0.78,
			reason: 'wikipedia-title-parenthetical-person',
			evidenceSource: 'title',
			keyword: '(person)',
		};
	}

	return undefined;
}

function containsKeyword(normalizedValue: string, keyword: string): boolean {
	const normalizedKeyword = normalizeForKeywordMatch(keyword);
	if (!normalizedKeyword) {
		return false;
	}

	const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}([^a-z0-9]|$)`);
	return pattern.test(normalizedValue);
}

function normalizeForKeywordMatch(value: string | undefined): string | undefined {
	const normalized = normalizeWhitespace(value)
		?.normalize('NFKD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase();
	return normalized && normalized.length > 0 ? normalized : undefined;
}

function normalizeWhitespace(value: string | undefined): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const normalized = value.replace(/\s+/g, ' ').trim();
	return normalized.length > 0 ? normalized : undefined;
}

function normalizeWikibaseItem(value: string | undefined): string | undefined {
	const normalized = normalizeWhitespace(value)?.toUpperCase();
	return normalized && /^Q\d+$/.test(normalized) ? normalized : undefined;
}

function dedupeStrings(values: Array<string | undefined>): string[] {
	const seen = new Set<string>();
	const output: string[] = [];
	for (const value of values) {
		const normalized = normalizeWhitespace(value);
		if (!normalized || seen.has(normalized)) {
			continue;
		}
		seen.add(normalized);
		output.push(normalized);
	}
	return output;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
