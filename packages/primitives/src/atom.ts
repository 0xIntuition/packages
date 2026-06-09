import {
	buildAtomData as classificationBuildAtomData,
	hasClassification,
	validateClassificationValues,
} from '@0xintuition/classifications';
import { calculateAtomId } from '@0xintuition/ids';

import type { AtomBlueprint, BuildResult } from './types.js';

/**
 * Build a classified atom with full validation.
 *
 * Returns a {@link BuildResult} containing either an {@link AtomBlueprint} with
 * the serialized JSON-LD atom data and deterministic atom ID, or a list of
 * validation errors.
 *
 * @example
 * ```ts
 * const result = buildAtom('person', { givenName: 'Vitalik', familyName: 'Buterin' });
 * if (result.success) {
 *   console.log(result.value.id);   // deterministic atom ID
 *   console.log(result.value.data); // JSON-LD string
 * }
 * ```
 *
 * @param classificationSlug - The classification slug (e.g. "person", "company").
 * @param values - A record of field values matching the classification spec.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildAtom(
	classificationSlug: string,
	values: Record<string, unknown>
): BuildResult<AtomBlueprint> {
	if (!hasClassification(classificationSlug)) {
		return {
			success: false,
			errors: [`Unknown classification "${classificationSlug}".`],
		};
	}

	const issues = validateClassificationValues(classificationSlug, values);

	if (issues.length > 0) {
		return {
			success: false,
			errors: issues.map((issue) => issue.message),
		};
	}

	const data = classificationBuildAtomData(classificationSlug, values);
	const id = calculateAtomId(data);

	return {
		success: true,
		value: {
			classification: classificationSlug,
			data,
			id,
			values: { ...values },
		},
	};
}

// ---------------------------------------------------------------------------
// Convenience builders for common classification types
// ---------------------------------------------------------------------------

/**
 * Build a Person atom.
 *
 * @example
 * ```ts
 * const result = buildPerson({ givenName: 'Vitalik', familyName: 'Buterin' });
 * if (result.success) {
 *   console.log(result.value.data);
 *   // '{"@context":"https://schema.org/","@type":"Person","givenName":"Vitalik","familyName":"Buterin"}'
 * }
 * ```
 *
 * @param values - Person field values. `givenName` and `familyName` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildPerson(values: {
	givenName: string;
	familyName: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('person', values);
}

/**
 * Build a Company (Organization) atom.
 *
 * @example
 * ```ts
 * const result = buildCompany({ name: 'Intuition Labs', url: 'https://intuition.systems' });
 * ```
 *
 * @param values - Company field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildCompany(values: {
	name: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('company', values);
}

/**
 * Build a Software (SoftwareSourceCode) atom.
 *
 * @example
 * ```ts
 * const result = buildSoftware({
 *   name: 'intuition-packages',
 *   codeRepository: 'https://github.com/0xIntuition/packages',
 * });
 * ```
 *
 * @param values - Software field values. `name` and `codeRepository` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildSoftware(values: {
	name: string;
	codeRepository: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('software', values);
}

/**
 * Build a MusicRecording atom.
 *
 * @example
 * ```ts
 * const result = buildMusicRecording({ name: 'One More Time', byArtist: 'Daft Punk' });
 * ```
 *
 * @param values - Music recording field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildMusicRecording(values: {
	name: string;
	byArtist?: string;
	inAlbum?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('music-recording', values);
}

/**
 * Build an Article atom.
 *
 * @example
 * ```ts
 * const result = buildArticle({ headline: 'Intuition Launches v1' });
 * ```
 *
 * @param values - Article field values. `headline` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildArticle(values: {
	headline: string;
	description?: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('article', values);
}

/**
 * Build a Book atom.
 *
 * @example
 * ```ts
 * const result = buildBook({ name: 'The Sovereign Individual', author: 'James Dale Davidson' });
 * ```
 *
 * @param values - Book field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildBook(values: {
	name: string;
	author?: string;
	isbn?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('book', values);
}

/**
 * Build a Brand atom.
 *
 * @example
 * ```ts
 * const result = buildBrand({ name: 'Intuition' });
 * ```
 *
 * @param values - Brand field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildBrand(values: {
	name: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('brand', values);
}

/**
 * Build a Product atom.
 *
 * @example
 * ```ts
 * const result = buildProduct({ name: 'Ledger Nano X', brand: 'Ledger' });
 * ```
 *
 * @param values - Product field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildProduct(values: {
	name: string;
	brand?: string;
	sku?: string;
	gtin?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('product', values);
}

/**
 * Build a WebPage atom.
 *
 * @example
 * ```ts
 * const result = buildWebPage({ name: 'Intuition Docs', url: 'https://docs.intuition.systems' });
 * ```
 *
 * @param values - WebPage field values. `name` and `url` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildWebPage(values: {
	name: string;
	url: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('web-page', values);
}

/**
 * Build a WebSite atom.
 *
 * @example
 * ```ts
 * const result = buildWebSite({ name: 'Intuition', url: 'https://intuition.systems' });
 * ```
 *
 * @param values - WebSite field values. `name` and `url` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildWebSite(values: {
	name: string;
	url: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('web-site', values);
}

/**
 * Build an Event atom.
 *
 * @example
 * ```ts
 * const result = buildEvent({ name: 'ETHDenver 2026', startDate: '2026-02-26' });
 * ```
 *
 * @param values - Event field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildEvent(values: {
	name: string;
	startDate?: string;
	location?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('event', values);
}

/**
 * Build a Movie atom.
 *
 * @example
 * ```ts
 * const result = buildMovie({ name: 'Inception', datePublished: '2010-07-16' });
 * ```
 *
 * @param values - Movie field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildMovie(values: {
	name: string;
	datePublished?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('movie', values);
}

/**
 * Build an EthereumAccount atom.
 *
 * @example
 * ```ts
 * const result = buildEthereumAccount({
 *   address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
 * });
 * ```
 *
 * @param values - EthereumAccount field values. `address` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildEthereumAccount(values: { address: string }): BuildResult<AtomBlueprint> {
	return buildAtom('ethereum-account', values);
}

/**
 * Build a DefinedTerm (concept/tag) atom.
 *
 * @example
 * ```ts
 * const result = buildDefinedTerm({ name: 'Decentralized Identity', description: 'A self-sovereign identity framework' });
 * ```
 *
 * @param values - DefinedTerm field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildDefinedTerm(values: {
	name: string;
	description?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('defined-term', values);
}

/**
 * Build a Thing atom (the most general classification).
 *
 * @example
 * ```ts
 * const result = buildThing({ name: 'My Custom Entity' });
 * ```
 *
 * @param values - Thing field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildThing(values: {
	name: string;
	description?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('thing', values);
}

// ---------------------------------------------------------------------------
// Additional convenience builders
// ---------------------------------------------------------------------------

/**
 * Build an AggregateRating atom.
 *
 * @example
 * ```ts
 * const result = buildAggregateRating({ ratingValue: '4.7', reviewCount: '1320' });
 * ```
 *
 * @param values - AggregateRating field values. `ratingValue` and `reviewCount` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildAggregateRating(values: {
	ratingValue: string | number;
	reviewCount: string | number;
	bestRating?: string | number;
	worstRating?: string | number;
}): BuildResult<AtomBlueprint> {
	return buildAtom('aggregate-rating', values);
}

/**
 * Build a Comment atom.
 *
 * @example
 * ```ts
 * const result = buildComment({ text: 'Great project!' });
 * ```
 *
 * @param values - Comment field values. `text` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildComment(values: {
	text: string;
	about?: string;
	dateCreated?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('comment', values);
}

/**
 * Build a Dataset atom.
 *
 * @example
 * ```ts
 * const result = buildDataset({ name: 'Global Surface Temperature' });
 * ```
 *
 * @param values - Dataset field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildDataset(values: {
	name: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('dataset', values);
}

/**
 * Build an ERC-20 Token atom.
 *
 * @example
 * ```ts
 * const result = buildERC20Token({
 *   chainId: '1',
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   name: 'USD Coin',
 *   symbol: 'USDC',
 *   decimals: '6',
 * });
 * ```
 *
 * @param values - ERC-20 field values. `chainId`, `address`, `name`, `symbol`, and `decimals` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildERC20Token(values: {
	chainId: string | number;
	address: string;
	name: string;
	symbol: string;
	decimals: string | number;
}): BuildResult<AtomBlueprint> {
	return buildAtom('ethereum-erc20', values);
}

/**
 * Build an Ethereum Smart Contract atom.
 *
 * @example
 * ```ts
 * const result = buildSmartContract({
 *   chainId: '1',
 *   address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
 * });
 * ```
 *
 * @param values - Smart contract field values. `chainId` and `address` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildSmartContract(values: {
	chainId: string | number;
	address: string;
}): BuildResult<AtomBlueprint> {
	return buildAtom('ethereum-smart-contract', values);
}

/**
 * Build an Image atom.
 *
 * @example
 * ```ts
 * const result = buildImage({ name: 'Logo', url: 'https://example.com/logo.png' });
 * ```
 *
 * @param values - Image field values. `name` and `url` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildImage(values: {
	name: string;
	url: string;
	caption?: string;
	keywords?: string[];
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('image', values);
}

/**
 * Build a JobPosting atom.
 *
 * @example
 * ```ts
 * const result = buildJobPosting({ title: 'Senior Protocol Engineer', hiringOrganization: 'Intuition Labs' });
 * ```
 *
 * @param values - JobPosting field values. `title` and `hiringOrganization` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildJobPosting(values: {
	title: string;
	hiringOrganization: string;
	jobLocation?: string;
	datePosted?: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('job-posting', values);
}

/**
 * Build a LocalBusiness atom.
 *
 * @example
 * ```ts
 * const result = buildLocalBusiness({ name: 'Blue Bottle Coffee' });
 * ```
 *
 * @param values - LocalBusiness field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildLocalBusiness(values: {
	name: string;
	address?: string;
	telephone?: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('local-business', values);
}

/**
 * Build a Location (Place) atom.
 *
 * @example
 * ```ts
 * const result = buildLocation({ name: 'Golden Gate Bridge' });
 * ```
 *
 * @param values - Location field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildLocation(values: {
	name: string;
	address?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('location', values);
}

/**
 * Build a MobileApplication atom.
 *
 * @example
 * ```ts
 * const result = buildMobileApplication({ name: 'Spotify', operatingSystem: 'iOS, Android' });
 * ```
 *
 * @param values - MobileApplication field values. `name` and `operatingSystem` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildMobileApplication(values: {
	name: string;
	operatingSystem: string;
	applicationCategory?: string;
	downloadUrl?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('mobile-application', values);
}

/**
 * Build a MusicAlbum atom.
 *
 * @example
 * ```ts
 * const result = buildMusicAlbum({ name: 'Discovery', byArtist: 'Daft Punk' });
 * ```
 *
 * @param values - MusicAlbum field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildMusicAlbum(values: {
	name: string;
	byArtist?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('music-album', values);
}

/**
 * Build a MusicGroup atom.
 *
 * @example
 * ```ts
 * const result = buildMusicGroup({ name: 'Daft Punk' });
 * ```
 *
 * @param values - MusicGroup field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildMusicGroup(values: {
	name: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('music-group', values);
}

/**
 * Build a NewsArticle atom.
 *
 * @example
 * ```ts
 * const result = buildNewsArticle({ headline: 'Intuition Launches v1', datePublished: '2026-02-26' });
 * ```
 *
 * @param values - NewsArticle field values. `headline` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildNewsArticle(values: {
	headline: string;
	datePublished?: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('news-article', values);
}

/**
 * Build a PodcastEpisode atom.
 *
 * @example
 * ```ts
 * const result = buildPodcastEpisode({ name: 'The Future of Onchain Reputation' });
 * ```
 *
 * @param values - PodcastEpisode field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildPodcastEpisode(values: {
	name: string;
	url?: string;
	partOfSeries?: string;
	datePublished?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('podcast-episode', values);
}

/**
 * Build a PodcastSeries atom.
 *
 * @example
 * ```ts
 * const result = buildPodcastSeries({ name: 'Bankless' });
 * ```
 *
 * @param values - PodcastSeries field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildPodcastSeries(values: {
	name: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('podcast-series', values);
}

/**
 * Build a Review atom.
 *
 * @example
 * ```ts
 * const result = buildReview({ reviewBody: 'Very smooth onboarding and transaction flow.' });
 * ```
 *
 * @param values - Review field values. `reviewBody` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildReview(values: {
	reviewBody: string;
	name?: string;
	itemReviewed?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('review', values);
}

/**
 * Build a Service atom.
 *
 * @example
 * ```ts
 * const result = buildService({ name: 'ENS Name Service', provider: 'ENS Labs' });
 * ```
 *
 * @param values - Service field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildService(values: {
	name: string;
	provider?: string;
	areaServed?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('service', values);
}

/**
 * Build a SocialMediaAccount atom.
 *
 * @example
 * ```ts
 * const result = buildSocialMediaAccount({ username: 'karpathy', platform: 'x' });
 * ```
 *
 * @param values - SocialMediaAccount field values. `username` and `platform` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildSocialMediaAccount(values: {
	username: string;
	platform: string;
	url?: string;
}): BuildResult<AtomBlueprint> {
	return buildAtom('social-media-account', values);
}

/**
 * Build a SocialMediaPosting atom.
 *
 * @example
 * ```ts
 * const result = buildSocialMediaPosting({ name: 'Launch Thread', text: 'We shipped it!' });
 * ```
 *
 * @param values - SocialMediaPosting field values. `name` and `text` are required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildSocialMediaPosting(values: {
	name: string;
	text: string;
	url?: string;
}): BuildResult<AtomBlueprint> {
	return buildAtom('social-media-posting', values);
}

/**
 * Build a SoftwareApplication atom.
 *
 * @example
 * ```ts
 * const result = buildSoftwareApplication({ name: 'Notion' });
 * ```
 *
 * @param values - SoftwareApplication field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildSoftwareApplication(values: {
	name: string;
	applicationCategory?: string;
	operatingSystem?: string;
	url?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('software-application', values);
}

/**
 * Build a TVSeries atom.
 *
 * @example
 * ```ts
 * const result = buildTVSeries({ name: 'Severance' });
 * ```
 *
 * @param values - TVSeries field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildTVSeries(values: {
	name: string;
	startDate?: string;
	endDate?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('tv-series', values);
}

/**
 * Build a VideoObject atom.
 *
 * @example
 * ```ts
 * const result = buildVideoObject({ name: 'How Intuition Works' });
 * ```
 *
 * @param values - VideoObject field values. `name` is required.
 * @returns A {@link BuildResult} with the atom blueprint or validation errors.
 */
export function buildVideoObject(values: {
	name: string;
	description?: string;
	contentUrl?: string;
	sameAs?: string[];
}): BuildResult<AtomBlueprint> {
	return buildAtom('video-object', values);
}
