import { appleMusicProvider } from './apple-music';
import { goodreadsProvider } from './goodreads';
import { musicBrainzProvider } from './musicbrainz';
import { oembedProvider } from './oembed';
import { openLibraryProvider } from './openlibrary';
import { spotifyProvider } from './spotify';
import { tmdbProvider } from './tmdb';
import type { ProviderMetricsScope, ProviderOperationSpec, ProviderRegistryEntry } from './types';
import { webProvider } from './web';
import { wikidataProvider } from './wikidata';
import { wikipediaProvider } from './wikipedia';
import { youtubeProvider } from './youtube';

export type { AppleMusicOperation } from './apple-music';
export type { OpenLibraryEnrichmentOperation, OpenLibrarySearchOperation } from './openlibrary';
export * from './types';

/**
 * Every observed provider. Adding one is a new file in this directory plus one
 * line here; the allowlists, series enumeration and exporters all derive from
 * this list. Order is exposition order.
 */
export const PROVIDER_REGISTRY = [
	openLibraryProvider,
	goodreadsProvider,
	musicBrainzProvider,
	appleMusicProvider,
	spotifyProvider,
	youtubeProvider,
	oembedProvider,
	tmdbProvider,
	webProvider,
	wikidataProvider,
	wikipediaProvider,
] as const;

type Registry = typeof PROVIDER_REGISTRY;
type OperationsByProvider = {
	[E in Registry[number] as E['provider']]: Extract<keyof E['operations'], string>;
};

export type ProviderName = Registry[number]['provider'];
/** Operation names of one provider. */
export type ProviderOperationOf<P extends ProviderName> = OperationsByProvider[P];
/** Any operation of any provider, uncorrelated with its provider; prefer {@link ProviderOperationRef}. */
export type ProviderOperation = OperationsByProvider[ProviderName];
/**
 * A `(provider, operation)` pair the registry knows. `{ provider: 'goodreads', operation: 'work' }`
 * does not type-check; events, observability declarations and the observation helpers all take
 * this shape, so the pairing is enforced at compile time and by the contract at runtime.
 */
export type ProviderOperationRef = {
	[P in ProviderName]: { provider: P; operation: ProviderOperationOf<P> };
}[ProviderName];

export type ProviderCircuitHost = Registry[number]['circuitHosts'][number]['host'];

/** A registered operation of a provider. */
export type RegisteredProviderOperation = {
	provider: ProviderName;
	operation: ProviderOperation;
	spec: ProviderOperationSpec;
};

/** The lookups every consumer of a registry needs, over any list of entries. */
export type ProviderRegistry = {
	entries: readonly ProviderRegistryEntry[];
	providerNames: readonly string[];
	/** Every operation registered for the scope, in exposition order. */
	operationsForScope(
		scope: ProviderMetricsScope
	): Array<{ provider: string; operation: string; spec: ProviderOperationSpec }>;
	/** The contract for `(provider, operation)`, or `undefined` when no such pair is registered. */
	lookupOperation(provider: string, operation: string): ProviderOperationSpec | undefined;
	/** Hosts whose breaker state the scope exports. */
	circuitHostsForScope(scope: ProviderMetricsScope): string[];
	/** Every circuit host of any scope; the allowlist for the gauge's `host` label. */
	circuitHosts: readonly string[];
};

/**
 * Builds the lookups over `entries`. `PROVIDER_REGISTRY` is the production list; tests build
 * their own (for example two providers that share an operation name) to prove what the
 * contract and exporters do with them.
 */
export function buildProviderRegistry(entries: readonly ProviderRegistryEntry[]): ProviderRegistry {
	return {
		entries,
		providerNames: entries.map((entry) => entry.provider),
		operationsForScope: (scope) =>
			entries.flatMap((entry) =>
				Object.entries(entry.operations)
					.filter(([, spec]) => spec.scopes.includes(scope))
					.map(([operation, spec]) => ({ provider: entry.provider, operation, spec }))
			),
		lookupOperation: (provider, operation) => {
			const entry = entries.find((candidate) => candidate.provider === provider);
			return entry && Object.hasOwn(entry.operations, operation)
				? entry.operations[operation]
				: undefined;
		},
		circuitHostsForScope: (scope) =>
			entries.flatMap((entry) =>
				entry.circuitHosts.filter((spec) => spec.scopes.includes(scope)).map((spec) => spec.host)
			),
		circuitHosts: entries.flatMap((entry) => entry.circuitHosts.map((spec) => spec.host)),
	};
}

const DEFAULT_REGISTRY = buildProviderRegistry(PROVIDER_REGISTRY);

export const PROVIDER_NAMES = DEFAULT_REGISTRY.providerNames as readonly ProviderName[];

/** Every operation registered for the scope, in exposition order. */
export function registeredOperationsForScope(
	scope: ProviderMetricsScope
): RegisteredProviderOperation[] {
	return DEFAULT_REGISTRY.operationsForScope(scope) as RegisteredProviderOperation[];
}

/** The contract for `(provider, operation)`, or `undefined` when no such pair is registered. */
export function lookupProviderOperation(
	provider: string,
	operation: string
): ProviderOperationSpec | undefined {
	return DEFAULT_REGISTRY.lookupOperation(provider, operation);
}

/** Hosts whose breaker state the scope exports. */
export function circuitHostsForScope(scope: ProviderMetricsScope): ProviderCircuitHost[] {
	return DEFAULT_REGISTRY.circuitHostsForScope(scope) as ProviderCircuitHost[];
}

/** Every circuit host of any scope; the allowlist for the gauge's `host` label. */
export const PROVIDER_CIRCUIT_HOSTS =
	DEFAULT_REGISTRY.circuitHosts as readonly ProviderCircuitHost[];
