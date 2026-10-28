import { slugify, toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';

type SteamTarget = {
	appId: string;
	canonicalUrl: string;
};

export type SteamPluginOptions = PlatformV0PluginOptions;

export const steamProfile: PlatformV0Profile = {
	domain: 'steam',
	display: {
		classificationSlugs: ['software-application'],
		exampleUrl: 'https://store.steampowered.com/app/620/Portal_2/',
		host: 'steampowered.com',
		label: 'Steam',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'steam-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseSteamUrl(input);
			if (!target) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'steam',
				subtype: 'app',
				confidence: 0.99,
				meta: {
					appId: target.appId,
					canonicalUrl: target.canonicalUrl,
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const appId = toStringMaybe(classification.meta.appId) ?? slugify(canonicalUrl);
		const name = `Steam App ${appId}`.trim();
		const canonicalId = `steam:app:${appId}`;

		return withPlatformMetadata(
			{
				schemaType: 'VideoGame',
				category: 'thing',
				title: name,
				canonicalId,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'VideoGame',
					name,
					identifier: canonicalId,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'steam',
			classification.subtype,
			{
				pluginId: 'steam',
				provider: 'steam',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createSteamPlugin(options: SteamPluginOptions = {}) {
	return createPlatformPlugin({
		pluginId: 'steam',
		resolverId: 'steam-resolver',
		profile: steamProfile,
		options,
	});
}

function parseSteamUrl(input: string): SteamTarget | undefined {
	const parsed = tryParseUrl(input);
	if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
		return undefined;
	}

	const host = parsed.hostname.toLowerCase();
	if (host !== 'store.steampowered.com' && host !== 'www.store.steampowered.com') {
		return undefined;
	}

	const match = parsed.pathname.match(/^\/app\/(\d{1,10})(?:\/[^/]+)?\/?$/i);
	const appId = normalizeSteamAppId(match?.[1]);
	if (!appId) {
		return undefined;
	}

	return {
		appId,
		canonicalUrl: `https://store.steampowered.com/app/${appId}/`,
	};
}

function normalizeSteamAppId(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const appId = Number.parseInt(value, 10);
	return Number.isSafeInteger(appId) && appId > 0 ? String(appId) : undefined;
}
