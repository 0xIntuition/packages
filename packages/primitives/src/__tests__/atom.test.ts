import { describe, expect, it } from 'vitest';
import {
	buildAggregateRating,
	buildArticle,
	buildAtom,
	buildBook,
	buildBrand,
	buildComment,
	buildCompany,
	buildDataset,
	buildDefinedTerm,
	buildERC20Token,
	buildEthereumAccount,
	buildEvent,
	buildImage,
	buildJobPosting,
	buildLocalBusiness,
	buildLocation,
	buildMobileApplication,
	buildMovie,
	buildMusicAlbum,
	buildMusicGroup,
	buildMusicRecording,
	buildNewsArticle,
	buildPerson,
	buildPodcastEpisode,
	buildPodcastSeries,
	buildProduct,
	buildReview,
	buildService,
	buildSmartContract,
	buildSocialMediaAccount,
	buildSocialMediaPosting,
	buildSoftware,
	buildSoftwareApplication,
	buildThing,
	buildTVSeries,
	buildVideoObject,
	buildWebPage,
	buildWebSite,
	calculateAtomId,
} from '../index';

describe('buildAtom', () => {
	it('builds a person atom with valid JSON-LD and deterministic ID', () => {
		const result = buildAtom('person', {
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('person');
		expect(result.value.values).toEqual({
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});

		const parsed = JSON.parse(result.value.data);

		expect(parsed).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'Person',
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});

		// Verify the ID matches the canonical calculation
		expect(result.value.id).toBe(calculateAtomId(result.value.data));
	});

	it('builds a company atom with schema.org Organization type', () => {
		const result = buildAtom('company', {
			name: 'Intuition Labs',
			url: 'https://intuition.systems',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		const parsed = JSON.parse(result.value.data);

		expect(parsed['@context']).toBe('https://schema.org/');
		expect(parsed['@type']).toBe('Organization');
		expect(parsed.name).toBe('Intuition Labs');
		expect(parsed.url).toBe('https://intuition.systems');
	});

	it('builds a blockchain classification with Intuition JSON-LD context', () => {
		const result = buildAtom('ethereum-erc20', {
			chainId: '1',
			address: '0x0000000000000000000000000000000000000001',
			name: 'Ether',
			symbol: 'ETH',
			decimals: '18',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		const parsed = JSON.parse(result.value.data);

		expect(parsed['@context']).toBe('https://schema.intuition.systems/v1/ethereum.jsonld');
		expect(parsed['@type']).toBe('EthereumERC20');
		expect(parsed.chainId).toBe('1');
		expect(parsed.address).toBe('0x0000000000000000000000000000000000000001');
	});

	it('returns errors for unknown classification', () => {
		const result = buildAtom('nonexistent', { name: 'test' });

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Unknown classification "nonexistent".');
	});

	it('returns errors for missing required fields', () => {
		const result = buildAtom('person', { givenName: 'Vitalik' });

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Missing required field "familyName".');
	});

	it('returns errors for invalid field values', () => {
		const result = buildAtom('web-page', {
			name: '',
			url: 'not-a-url',
		});

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Field "name" must be a non-empty string.');
		expect(result.errors).toContain('Field "url" must be a valid URL string.');
	});

	it('returns errors for unknown fields', () => {
		const result = buildAtom('person', {
			givenName: 'Vitalik',
			familyName: 'Buterin',
			extraField: 'whoops',
		});

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Unknown field "extraField" for classification "person".');
	});

	it('produces deterministic IDs for identical inputs', () => {
		const result1 = buildAtom('person', {
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});
		const result2 = buildAtom('person', {
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});

		expect(result1.success).toBe(true);
		expect(result2.success).toBe(true);

		if (!result1.success || !result2.success) {
			return;
		}

		expect(result1.value.id).toBe(result2.value.id);
		expect(result1.value.data).toBe(result2.value.data);
	});

	it('produces different IDs for different inputs', () => {
		const result1 = buildAtom('person', {
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});
		const result2 = buildAtom('person', {
			givenName: 'Satoshi',
			familyName: 'Nakamoto',
		});

		expect(result1.success).toBe(true);
		expect(result2.success).toBe(true);

		if (!result1.success || !result2.success) {
			return;
		}

		expect(result1.value.id).not.toBe(result2.value.id);
	});

	it('does not mutate the original values object', () => {
		const values = { givenName: 'Vitalik', familyName: 'Buterin' };
		const result = buildAtom('person', values);

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		// Values should be copied, not the same reference
		expect(result.value.values).toEqual(values);
		expect(result.value.values).not.toBe(values);
	});
});

describe('convenience builders', () => {
	it('buildPerson builds a valid person atom', () => {
		const result = buildPerson({
			givenName: 'Vitalik',
			familyName: 'Buterin',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('person');
	});

	it('buildCompany builds a valid company atom', () => {
		const result = buildCompany({
			name: 'Intuition Labs',
			url: 'https://intuition.systems',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('company');
	});

	it('buildSoftware builds a valid software atom', () => {
		const result = buildSoftware({
			name: 'intuition-packages',
			codeRepository: 'https://github.com/0xIntuition/packages',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('software');

		const parsed = JSON.parse(result.value.data);

		expect(parsed['@type']).toBe('SoftwareSourceCode');
	});

	it('buildMusicRecording builds a valid music recording atom', () => {
		const result = buildMusicRecording({
			name: 'One More Time',
			byArtist: 'Daft Punk',
			inAlbum: 'Discovery',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('music-recording');
	});

	it('buildArticle builds a valid article atom', () => {
		const result = buildArticle({ headline: 'Intuition Launches v1' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('article');
	});

	it('buildBook builds a valid book atom', () => {
		const result = buildBook({ name: 'The Sovereign Individual' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('book');
	});

	it('buildBrand builds a valid brand atom', () => {
		const result = buildBrand({ name: 'Patagonia' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('brand');
	});

	it('buildProduct builds a valid product atom', () => {
		const result = buildProduct({ name: 'Ledger Nano X', brand: 'Ledger' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('product');
	});

	it('buildWebPage builds a valid web page atom', () => {
		const result = buildWebPage({
			name: 'Intuition Docs',
			url: 'https://docs.intuition.systems',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('web-page');
	});

	it('buildWebSite builds a valid web site atom', () => {
		const result = buildWebSite({
			name: 'Intuition',
			url: 'https://intuition.systems',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('web-site');
	});

	it('buildEvent builds a valid event atom', () => {
		const result = buildEvent({
			name: 'ETHDenver 2026',
			startDate: '2026-02-26',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('event');
	});

	it('buildMovie builds a valid movie atom', () => {
		const result = buildMovie({ name: 'Inception' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('movie');
	});

	it('buildEthereumAccount builds a valid ethereum account atom', () => {
		const result = buildEthereumAccount({
			address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('ethereum-account');
	});

	it('buildDefinedTerm builds a valid defined term atom', () => {
		const result = buildDefinedTerm({ name: 'Knowledge Graph' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('defined-term');
	});

	it('buildThing builds a valid thing atom', () => {
		const result = buildThing({ name: 'My Custom Entity' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('thing');
	});

	it('convenience builders return errors on invalid input', () => {
		const result = buildSoftware({
			name: 'test',
			codeRepository: 'not-a-url',
		});

		expect(result.success).toBe(false);

		if (result.success) {
			return;
		}

		expect(result.errors).toContain('Field "codeRepository" must be a valid URL string.');
	});

	it('buildAggregateRating builds a valid aggregate rating atom', () => {
		const result = buildAggregateRating({
			ratingValue: '4.7',
			reviewCount: '1320',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('aggregate-rating');
	});

	it('buildComment builds a valid comment atom', () => {
		const result = buildComment({ text: 'Great project!' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('comment');
	});

	it('buildDataset builds a valid dataset atom', () => {
		const result = buildDataset({ name: 'Global Surface Temperature' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('dataset');
	});

	it('buildERC20Token builds a valid ERC-20 token atom', () => {
		const result = buildERC20Token({
			chainId: '1',
			address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			name: 'USD Coin',
			symbol: 'USDC',
			decimals: '6',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('ethereum-erc20');

		const parsed = JSON.parse(result.value.data);

		expect(parsed['@context']).toBe('https://schema.intuition.systems/v1/ethereum.jsonld');
		expect(parsed['@type']).toBe('EthereumERC20');
		expect(parsed.symbol).toBe('USDC');
	});

	it('buildSmartContract builds a valid smart contract atom', () => {
		const result = buildSmartContract({
			chainId: '1',
			address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('ethereum-smart-contract');
	});

	it('buildImage builds a valid image atom', () => {
		const result = buildImage({
			name: 'Logo',
			url: 'https://example.com/logo.png',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('image');
	});

	it('buildJobPosting builds a valid job posting atom', () => {
		const result = buildJobPosting({
			title: 'Senior Protocol Engineer',
			hiringOrganization: 'Intuition Labs',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('job-posting');
	});

	it('buildLocalBusiness builds a valid local business atom', () => {
		const result = buildLocalBusiness({ name: 'Blue Bottle Coffee' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('local-business');
	});

	it('buildLocation builds a valid location atom', () => {
		const result = buildLocation({ name: 'Golden Gate Bridge' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('location');

		const parsed = JSON.parse(result.value.data);

		expect(parsed['@type']).toBe('Place');
	});

	it('buildMobileApplication builds a valid mobile application atom', () => {
		const result = buildMobileApplication({
			name: 'Spotify',
			operatingSystem: 'iOS, Android',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('mobile-application');
	});

	it('buildMusicAlbum builds a valid music album atom', () => {
		const result = buildMusicAlbum({
			name: 'Discovery',
			byArtist: 'Daft Punk',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('music-album');
	});

	it('buildMusicGroup builds a valid music group atom', () => {
		const result = buildMusicGroup({ name: 'Daft Punk' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('music-group');
	});

	it('buildNewsArticle builds a valid news article atom', () => {
		const result = buildNewsArticle({
			headline: 'Intuition Launches v1',
			datePublished: '2026-02-26',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('news-article');
	});

	it('buildPodcastEpisode builds a valid podcast episode atom', () => {
		const result = buildPodcastEpisode({
			name: 'The Future of Onchain Reputation',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('podcast-episode');
	});

	it('buildPodcastSeries builds a valid podcast series atom', () => {
		const result = buildPodcastSeries({ name: 'Bankless' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('podcast-series');
	});

	it('buildReview builds a valid review atom', () => {
		const result = buildReview({
			reviewBody: 'Very smooth onboarding.',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('review');
	});

	it('buildService builds a valid service atom', () => {
		const result = buildService({
			name: 'ENS Name Service',
			provider: 'ENS Labs',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('service');
	});

	it('buildSocialMediaAccount builds a valid social media account atom', () => {
		const result = buildSocialMediaAccount({
			username: 'karpathy',
			platform: 'x',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('social-media-account');
	});

	it('buildSocialMediaPosting builds a valid social media posting atom', () => {
		const result = buildSocialMediaPosting({
			name: 'Launch Thread',
			text: 'We shipped it!',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('social-media-posting');
	});

	it('buildSoftwareApplication builds a valid software application atom', () => {
		const result = buildSoftwareApplication({ name: 'Notion' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('software-application');

		const parsed = JSON.parse(result.value.data);

		expect(parsed['@type']).toBe('SoftwareApplication');
	});

	it('buildTVSeries builds a valid TV series atom', () => {
		const result = buildTVSeries({
			name: 'Severance',
			startDate: '2022-02-18',
		});

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('tv-series');
	});

	it('buildVideoObject builds a valid video object atom', () => {
		const result = buildVideoObject({ name: 'How Intuition Works' });

		expect(result.success).toBe(true);

		if (!result.success) {
			return;
		}

		expect(result.value.classification).toBe('video-object');
	});
});
