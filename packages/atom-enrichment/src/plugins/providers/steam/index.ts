import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import { type FetchLike, fetchJsonWithSchema } from '../__shared__/http';
import { getIdentifier, getRequestName, getRequestUrl } from '../__shared__/request';
import { steamAppDetailsResponseSchema } from './external';
import { type SteamPriceOverview, steamAppDataSchema } from './schema';

type CreateSteamPluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	TTL?: number;
	countryCode?: string;
	language?: string;
};

const steamAppIdPattern = /^\d{1,10}$/;

export function createSteamPlugin(options: CreateSteamPluginOptions = {}): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);
	const countryCode = options.countryCode ?? 'us';
	const language = options.language ?? 'en';

	return defineEnrichmentPlugin({
		id: 'steam',
		version: '1.0.0',
		runtime: 'server',
		artifactTypes: ['steam-app'],
		priority: options.priority ?? 54,
		TTL: options.TTL ?? 43_200,

		supports(request: EnrichmentRequest) {
			return resolveSteamAppId(request) !== undefined;
		},

		async enrich(request, ctx) {
			const appId = resolveSteamAppId(request);
			if (appId === undefined) {
				return [];
			}

			const query = new URLSearchParams({
				appids: String(appId),
				cc: countryCode,
				l: language,
			});
			const payload = await fetchJsonWithSchema(
				fetcher,
				`https://store.steampowered.com/api/appdetails?${query.toString()}`,
				steamAppDetailsResponseSchema,
				{ signal: ctx.signal }
			);

			const appPayload = payload[String(appId)];
			if (appPayload?.success === false || !appPayload?.data) {
				return [];
			}

			const data = appPayload.data;
			const name = toStringMaybe(data.name) ?? `Steam App ${appId}`;
			const steamUrl = `https://store.steampowered.com/app/${appId}/`;

			return [
				{
					artifact_type: 'steam-app',
					data: steamAppDataSchema.parse({
						appId,
						name,
						type: toStringMaybe(data.type),
						steamUrl,
						shortDescription: stripHtml(toStringMaybe(data.short_description)),
						headerImage: toStringMaybe(data.header_image),
						capsuleImage: toStringMaybe(data.capsule_imagev5) ?? toStringMaybe(data.capsule_image),
						developers: toStringArray(data.developers),
						publishers: toStringArray(data.publishers),
						releaseDate: toReleaseDate(data.release_date),
						comingSoon: toBooleanMaybe(toRecordMaybe(data.release_date)?.coming_soon),
						genres: toNameArray(data.genres),
						categories: toNameArray(data.categories),
						platforms: toPlatformArray(data.platforms),
						metacriticScore: toNumberMaybe(toRecordMaybe(data.metacritic)?.score),
						recommendationsTotal: toNumberMaybe(toRecordMaybe(data.recommendations)?.total),
						isFree: toBooleanMaybe(data.is_free),
						priceOverview: toPriceOverview(data.price_overview),
					}),
					meta: {
						pluginId: 'steam',
						provider: 'steam',
						fetchedAt: ctx.now(),
						sourceUrl: steamUrl,
					},
				},
			];
		},
	});
}

export function parseSteamAppIdFromUrl(url: string): number | undefined {
	try {
		const parsed = new URL(url);
		if (!isSteamHost(parsed.hostname)) {
			return undefined;
		}

		const appMatch = parsed.pathname.match(/^\/app\/(\d+)/i);
		if (!appMatch?.[1]) {
			return undefined;
		}

		return parseSteamAppId(appMatch[1]);
	} catch {
		return undefined;
	}
}

function isSteamHost(hostname: string): boolean {
	const normalized = hostname.toLowerCase();
	return (
		normalized === 'steampowered.com' ||
		normalized.endsWith('.steampowered.com') ||
		normalized === 'steamcommunity.com' ||
		normalized.endsWith('.steamcommunity.com')
	);
}

function resolveSteamAppId(request: EnrichmentRequest): number | undefined {
	const identifier = getIdentifier(
		request,
		'steam',
		'steamAppId',
		'steam_app',
		'steamApp',
		'appid',
		'appId'
	);
	if (identifier) {
		const parsedIdentifier = parseSteamReference(identifier);
		if (parsedIdentifier !== undefined) {
			return parsedIdentifier;
		}
	}

	const url = getRequestUrl(request);
	if (url) {
		const parsedUrl = parseSteamAppIdFromUrl(url);
		if (parsedUrl !== undefined) {
			return parsedUrl;
		}
	}

	const name = getRequestName(request);
	return name ? parseSteamReference(name) : undefined;
}

function parseSteamReference(value: string): number | undefined {
	const trimmed = value.trim();
	const prefixedMatch = trimmed.match(/^(?:steam:)?(?:app|game):(\d+)$/i);
	return parseSteamAppId(prefixedMatch?.[1] ?? trimmed);
}

function parseSteamAppId(value: string | undefined): number | undefined {
	if (!value || !steamAppIdPattern.test(value)) {
		return undefined;
	}
	const appId = Number.parseInt(value, 10);
	return Number.isSafeInteger(appId) && appId > 0 ? appId : undefined;
}

function toRecordMaybe(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function toStringMaybe(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function toNumberMaybe(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	return undefined;
}

function toBooleanMaybe(value: unknown): boolean | undefined {
	return typeof value === 'boolean' ? value : undefined;
}

function toStringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const values = value.map(toStringMaybe).filter((entry): entry is string => entry !== undefined);
	return values.length > 0 ? values : undefined;
}

function toNameArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const values = value
		.map((entry) => toStringMaybe(toRecordMaybe(entry)?.description))
		.filter((entry): entry is string => entry !== undefined);
	return values.length > 0 ? values : undefined;
}

function toPlatformArray(value: unknown): string[] | undefined {
	const record = toRecordMaybe(value);
	if (!record) {
		return undefined;
	}
	const platforms = Object.entries(record)
		.filter(([, enabled]) => enabled === true)
		.map(([platform]) => platform);
	return platforms.length > 0 ? platforms : undefined;
}

function toReleaseDate(value: unknown): string | undefined {
	const date = toStringMaybe(toRecordMaybe(value)?.date);
	return date && date.length > 0 ? date : undefined;
}

function toPriceOverview(value: unknown): SteamPriceOverview | undefined {
	const record = toRecordMaybe(value);
	if (!record) {
		return undefined;
	}

	return {
		currency: toStringMaybe(record.currency),
		initial: toNumberMaybe(record.initial),
		final: toNumberMaybe(record.final),
		discountPercent: toNumberMaybe(record.discount_percent),
		finalFormatted: toStringMaybe(record.final_formatted),
	};
}

function stripHtml(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}
	const normalized = value
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return normalized.length > 0 ? normalized : undefined;
}
