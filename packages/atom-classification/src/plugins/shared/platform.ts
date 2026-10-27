import { isPipelineErrorKind, type PipelineErrorKind } from '@0xintuition/pipeline-runtime/errors';
import type { AcquisitionOutcome } from '../../acquisition-outcome';
import type { AtomClassificationPlugin, AtomClassifier, ResolverAtom } from '../../plugins';
import type { ClassificationClientClassificationHint, ClassificationRuntime } from '../../types';
import { TYPE_PROFILES_PLUGIN_ID } from './constants';

export const PLATFORM_DOMAINS = [
	'spotify',
	'amazon',
	'github',
	'goodreads',
	'letterboxd',
	'places',
	'npm',
	'x',
	'instagram',
	'tiktok',
	'youtube',
	'wikipedia',
	'wikidata',
	'imdb',
	'tmdb',
	'openlibrary',
	'steam',
	'coingecko',
	'coinmarketcap',
	'etsy',
	'shopify',
] as const;

export type PlatformDomain = (typeof PLATFORM_DOMAINS)[number];

type PlatformFallbackStage =
	| 'domain-api'
	| 'domain-html'
	| 'public-metadata'
	| 'oembed'
	| 'opengraph'
	| 'generic';

export type PlatformCredential = {
	apiKey?: string;
	token?: string;
	clientId?: string;
	clientSecret?: string;
	enabled?: boolean;
};

export type PlatformStageInput = {
	runtime: ClassificationRuntime;
	now: string;
	signal?: AbortSignal;
	/** Epoch ms at which the resolver timeout aborts `signal` (absent outside the engine). */
	deadlineAtMs?: number;
	domain: PlatformDomain;
	classification: ClassificationClientClassificationHint;
	requestInput: string;
	canonicalUrl: string;
	credential?: PlatformCredential;
	stageContext: Map<unknown, unknown>;
};

const PLATFORM_STAGE_MISS_BRAND: unique symbol = Symbol('platform-stage-miss');
const PLATFORM_STAGE_OUTCOME_BRAND: unique symbol = Symbol('platform-stage-outcome');

export type PlatformStageMiss = {
	readonly kind: 'platform_stage_miss';
	readonly [PLATFORM_STAGE_MISS_BRAND]: true;
};

const platformStageMiss = {
	kind: 'platform_stage_miss',
} as PlatformStageMiss;
Object.defineProperty(platformStageMiss, PLATFORM_STAGE_MISS_BRAND, { value: true });

export const PLATFORM_STAGE_MISS: PlatformStageMiss = Object.freeze(platformStageMiss);

export type PlatformStageOutcome = {
	readonly kind: 'platform_stage_outcome';
	readonly atom: ResolverAtom | null;
	readonly diagnostics: readonly unknown[];
	readonly terminal: boolean;
	readonly availability?: 'degraded' | 'unavailable';
	readonly reason?: PipelineErrorKind;
	readonly [PLATFORM_STAGE_OUTCOME_BRAND]: true;
};

// Constructor-membership registry: brand symbols are readable through the
// prototype chain, so an Object.create(genuineOutcome) derivative would
// otherwise inherit the brand without ever passing through this constructor.
const constructedOutcomes = new WeakSet<PlatformStageOutcome>();

export function createPlatformStageOutcome(
	atom: ResolverAtom | null,
	diagnostics: readonly unknown[],
	options: {
		availability?: 'degraded' | 'unavailable';
		reason?: PipelineErrorKind;
		terminal?: boolean;
	} = {}
): PlatformStageOutcome {
	const outcome = {
		kind: 'platform_stage_outcome',
		atom,
		diagnostics: Object.freeze([...diagnostics]),
		terminal: options.terminal === true,
		...(options.availability ? { availability: options.availability } : {}),
		...(options.reason ? { reason: options.reason } : {}),
	} as PlatformStageOutcome;
	Object.defineProperty(outcome, PLATFORM_STAGE_OUTCOME_BRAND, { value: true });

	const frozen = Object.freeze(outcome);
	constructedOutcomes.add(frozen);
	return frozen;
}

export function createPlatformStageDiagnostic(
	reason: PipelineErrorKind,
	message: string
): Error & { readonly reason: PipelineErrorKind } {
	return Object.assign(new Error(message), { reason });
}

export type PlatformStageAdapter = (
	input: PlatformStageInput
) =>
	| ResolverAtom
	| PlatformStageMiss
	| PlatformStageOutcome
	| Promise<ResolverAtom | PlatformStageMiss | PlatformStageOutcome | null | undefined>
	| null
	| undefined;

export function isPlatformStageMiss(value: unknown): value is PlatformStageMiss {
	return value === PLATFORM_STAGE_MISS;
}

export function isPlatformStageOutcome(value: unknown): value is PlatformStageOutcome {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	if (!constructedOutcomes.has(value as PlatformStageOutcome)) {
		return false;
	}

	const candidate = value as Partial<PlatformStageOutcome>;
	return (
		candidate[PLATFORM_STAGE_OUTCOME_BRAND] === true &&
		candidate.kind === 'platform_stage_outcome' &&
		(candidate.atom === null || isResolverAtom(candidate.atom)) &&
		Array.isArray(candidate.diagnostics) &&
		typeof candidate.terminal === 'boolean'
	);
}

export type PlatformV0PluginOptions = {
	credentials?: Partial<Record<PlatformDomain, PlatformCredential>>;
	adapters?: {
		domainApi?: PlatformStageAdapter;
		domainHtml?: PlatformStageAdapter;
		publicMetadata?: PlatformStageAdapter;
		oEmbed?: PlatformStageAdapter;
		openGraph?: PlatformStageAdapter;
	};
};

export type PlatformV0Profile = {
	domain: PlatformDomain;
	display: {
		classificationSlugs: readonly string[];
		exampleUrl: string;
		host: string;
		label: string;
	};
	supportsOEmbed: boolean;
	allowDomainApiWithoutCredentials?: boolean;
	classifier: AtomClassifier;
	resolveGeneric: (input: {
		classification: ClassificationClientClassificationHint;
		requestInput: string;
		canonicalUrl: string;
		now: string;
	}) => ResolverAtom | null;
};

export function isPlatformDomain(value: string): value is PlatformDomain {
	return PLATFORM_DOMAINS.includes(value as PlatformDomain);
}

export function createPlatformPlugin(input: {
	pluginId: string;
	resolverId: string;
	profile: PlatformV0Profile;
	options?: PlatformV0PluginOptions;
}): AtomClassificationPlugin {
	const { pluginId, profile, resolverId } = input;
	const options = input.options ?? {};

	return {
		manifest: {
			id: pluginId,
			version: '0.1.0',
			engineRange: '^0.1.0',
			runtime: 'universal',
			capabilities: [`classify:url:${profile.domain}`, 'resolve:url:v0'],
			permissions: [],
			dependsOn: [TYPE_PROFILES_PLUGIN_ID],
			provides: [`platform:v0:${profile.domain}`],
			priority: 20,
		},
		classifiers: [profile.classifier],
		resolvers: [
			{
				id: resolverId,
				priority: 40,
				executionMode: 'deterministic',
				canResolve: (classification) =>
					classification.type === 'url' && classification.domain === profile.domain,
				resolve: async ({ runtime, classification, request, now, signal, deadlineAtMs }) => {
					if (classification.type !== 'url' || classification.domain !== profile.domain) {
						return null;
					}

					const resolved = await resolveWithFallbackChain({
						runtime,
						pluginId,
						profile,
						classification,
						requestInput: request.input,
						now,
						signal,
						deadlineAtMs,
						options,
					});
					if (!resolved) {
						return null;
					}
					if (resolved.terminal || !resolved.atom) {
						const acquisitionOutcome = {
							status: resolved.availability ?? 'degraded',
							terminal: true,
							stage: resolved.stage,
							...(resolved.reason ? { reason: resolved.reason } : {}),
						} satisfies AcquisitionOutcome;
						return {
							atoms: [],
							errors: resolved.stageErrors,
							fallbackUsed: true,
							terminal: true,
							classificationMetaPatch: {
								acquisitionOutcome,
							},
							metadata: {
								platformResolver: {
									domain: profile.domain,
									fallbackStage: resolved.stage,
									attemptedStages: resolved.attemptedStages,
									skippedStages: resolved.skippedStages,
									stageErrors: resolved.stageErrors,
								},
							},
						};
					}

					return {
						fallbackUsed: resolved.fallbackUsed,
						atoms: [
							{
								...resolved.atom,
								metadata: {
									...(resolved.atom.metadata ?? {}),
									skippedStages: Array.isArray(resolved.atom.metadata?.skippedStages)
										? resolved.atom.metadata.skippedStages
										: resolved.skippedStages,
								},
							},
						],
						errors: resolved.stageErrors,
						metadata: {
							platformResolver: {
								domain: profile.domain,
								fallbackStage: resolved.stage,
								attemptedStages: resolved.attemptedStages,
								skippedStages: resolved.skippedStages,
								stageErrors: resolved.stageErrors,
							},
						},
					};
				},
			},
		],
	};
}

async function resolveWithFallbackChain(input: {
	runtime: ClassificationRuntime;
	pluginId: string;
	profile: PlatformV0Profile;
	classification: ClassificationClientClassificationHint;
	requestInput: string;
	now: string;
	signal?: AbortSignal;
	deadlineAtMs?: number | undefined;
	options: PlatformV0PluginOptions;
}): Promise<{
	stage: PlatformFallbackStage;
	fallbackUsed: boolean;
	atom: ResolverAtom | null;
	terminal: boolean;
	availability?: 'degraded' | 'unavailable';
	reason?: PipelineErrorKind;
	attemptedStages: PlatformFallbackStage[];
	skippedStages: string[];
	stageErrors: string[];
} | null> {
	const { classification, now, options, profile, requestInput, runtime, signal, deadlineAtMs } =
		input;
	const canonicalUrl =
		(typeof classification.meta.canonicalUrl === 'string' && classification.meta.canonicalUrl) ||
		requestInput;
	const attemptedStages: PlatformFallbackStage[] = [];
	const skippedStages: string[] = [];
	const stageErrors: string[] = [];
	const stageContext = new Map<unknown, unknown>();
	const credential = options.credentials?.[profile.domain];
	const canAttemptDomainApi =
		!!options.adapters?.domainApi &&
		(isCredentialConfigured(credential) || profile.allowDomainApiWithoutCredentials === true);

	if (canAttemptDomainApi) {
		attemptedStages.push('domain-api');
		const domainApiCandidate = await tryStageAdapter('domain-api', options.adapters?.domainApi, {
			runtime,
			now,
			signal,
			deadlineAtMs,
			domain: profile.domain,
			classification,
			requestInput,
			canonicalUrl,
			credential,
			stageContext,
		});

		stageErrors.push(...domainApiCandidate.errors);
		if (domainApiCandidate.terminal) {
			return terminalStageResult(
				'domain-api',
				attemptedStages,
				skippedStages,
				stageErrors,
				domainApiCandidate
			);
		}
		if (domainApiCandidate.atom) {
			return {
				stage: 'domain-api',
				fallbackUsed: false,
				atom: finalizeStageAtom(domainApiCandidate.atom, {
					pluginId: input.pluginId,
					stage: 'domain-api',
					domain: profile.domain,
					attemptedStages,
					canonicalUrl,
					now,
				}),
				terminal: false,
				attemptedStages,
				skippedStages,
				stageErrors,
			};
		}
	} else if (!profile.allowDomainApiWithoutCredentials) {
		skippedStages.push('domain-api:no-credentials');
	}

	if (options.adapters?.domainHtml) {
		attemptedStages.push('domain-html');
		const domainHtmlCandidate = await tryStageAdapter('domain-html', options.adapters.domainHtml, {
			runtime,
			now,
			signal,
			deadlineAtMs,
			domain: profile.domain,
			classification,
			requestInput,
			canonicalUrl,
			credential,
			stageContext,
		});

		stageErrors.push(...domainHtmlCandidate.errors);
		if (domainHtmlCandidate.terminal) {
			return terminalStageResult(
				'domain-html',
				attemptedStages,
				skippedStages,
				stageErrors,
				domainHtmlCandidate
			);
		}
		if (domainHtmlCandidate.atom) {
			return {
				stage: 'domain-html',
				fallbackUsed: false,
				atom: finalizeStageAtom(domainHtmlCandidate.atom, {
					pluginId: input.pluginId,
					stage: 'domain-html',
					domain: profile.domain,
					attemptedStages,
					canonicalUrl,
					now,
				}),
				terminal: false,
				attemptedStages,
				skippedStages,
				stageErrors,
			};
		}
	}

	if (options.adapters?.publicMetadata) {
		attemptedStages.push('public-metadata');
		const publicMetadataCandidate = await tryStageAdapter(
			'public-metadata',
			options.adapters.publicMetadata,
			{
				runtime,
				now,
				signal,
				deadlineAtMs,
				domain: profile.domain,
				classification,
				requestInput,
				canonicalUrl,
				credential,
				stageContext,
			}
		);

		stageErrors.push(...publicMetadataCandidate.errors);
		if (publicMetadataCandidate.terminal) {
			return terminalStageResult(
				'public-metadata',
				attemptedStages,
				skippedStages,
				stageErrors,
				publicMetadataCandidate
			);
		}
		if (publicMetadataCandidate.atom) {
			return {
				stage: 'public-metadata',
				fallbackUsed: true,
				atom: finalizeStageAtom(publicMetadataCandidate.atom, {
					pluginId: input.pluginId,
					stage: 'public-metadata',
					domain: profile.domain,
					attemptedStages,
					canonicalUrl,
					now,
				}),
				terminal: false,
				attemptedStages,
				skippedStages,
				stageErrors,
			};
		}
	}

	if (profile.supportsOEmbed) {
		attemptedStages.push('oembed');
		const oembedCandidate = await tryStageAdapter('oembed', options.adapters?.oEmbed, {
			runtime,
			now,
			signal,
			deadlineAtMs,
			domain: profile.domain,
			classification,
			requestInput,
			canonicalUrl,
			credential,
			stageContext,
		});

		stageErrors.push(...oembedCandidate.errors);
		if (oembedCandidate.terminal) {
			return terminalStageResult(
				'oembed',
				attemptedStages,
				skippedStages,
				stageErrors,
				oembedCandidate
			);
		}
		if (oembedCandidate.atom) {
			return {
				stage: 'oembed',
				fallbackUsed: true,
				atom: finalizeStageAtom(oembedCandidate.atom, {
					pluginId: input.pluginId,
					stage: 'oembed',
					domain: profile.domain,
					attemptedStages,
					canonicalUrl,
					now,
				}),
				terminal: false,
				attemptedStages,
				skippedStages,
				stageErrors,
			};
		}
	} else {
		skippedStages.push('oembed:unsupported');
	}

	attemptedStages.push('opengraph');
	const openGraphCandidate = await tryStageAdapter('opengraph', options.adapters?.openGraph, {
		runtime,
		now,
		signal,
		deadlineAtMs,
		domain: profile.domain,
		classification,
		requestInput,
		canonicalUrl,
		credential,
		stageContext,
	});

	stageErrors.push(...openGraphCandidate.errors);
	if (openGraphCandidate.terminal) {
		return terminalStageResult(
			'opengraph',
			attemptedStages,
			skippedStages,
			stageErrors,
			openGraphCandidate
		);
	}
	if (openGraphCandidate.atom) {
		return {
			stage: 'opengraph',
			fallbackUsed: true,
			atom: finalizeStageAtom(openGraphCandidate.atom, {
				pluginId: input.pluginId,
				stage: 'opengraph',
				domain: profile.domain,
				attemptedStages,
				canonicalUrl,
				now,
			}),
			terminal: false,
			attemptedStages,
			skippedStages,
			stageErrors,
		};
	}

	attemptedStages.push('generic');
	const genericAtom = profile.resolveGeneric({
		classification,
		requestInput,
		canonicalUrl,
		now,
	});
	if (!genericAtom) {
		return null;
	}

	return {
		stage: 'generic',
		fallbackUsed: true,
		atom: finalizeStageAtom(genericAtom, {
			pluginId: input.pluginId,
			stage: 'generic',
			domain: profile.domain,
			attemptedStages,
			canonicalUrl,
			now,
		}),
		terminal: false,
		attemptedStages,
		skippedStages,
		stageErrors,
	};
}

function terminalStageResult(
	stage: PlatformFallbackStage,
	attemptedStages: PlatformFallbackStage[],
	skippedStages: string[],
	stageErrors: string[],
	outcome: { availability?: 'degraded' | 'unavailable'; reason?: PipelineErrorKind }
) {
	return {
		stage,
		fallbackUsed: true,
		atom: null,
		terminal: true,
		...(outcome.availability ? { availability: outcome.availability } : {}),
		...(outcome.reason ? { reason: outcome.reason } : {}),
		attemptedStages,
		skippedStages,
		stageErrors,
	};
}

async function tryStageAdapter(
	stage: PlatformFallbackStage,
	adapter: PlatformStageAdapter | undefined,
	input: PlatformStageInput
): Promise<{
	atom: ResolverAtom | null;
	availability?: 'degraded' | 'unavailable';
	errors: string[];
	reason?: PipelineErrorKind;
	terminal: boolean;
}> {
	if (!adapter) {
		return { atom: null, errors: [], terminal: false };
	}

	try {
		const candidate = await Promise.resolve(adapter(input));
		if (isPlatformStageMiss(candidate)) {
			return { atom: null, errors: [], terminal: false };
		}
		if (isPlatformStageOutcome(candidate)) {
			return {
				atom: candidate.atom,
				errors: candidate.diagnostics.map((diagnostic) =>
					formatPlatformStageError(stage, diagnostic)
				),
				terminal: candidate.terminal,
				...(candidate.availability ? { availability: candidate.availability } : {}),
				...(candidate.reason ? { reason: candidate.reason } : {}),
			};
		}
		if (!candidate) {
			return { atom: null, errors: [`${stage}:adapter_null`], terminal: false };
		}
		const reservedProtocolKind = readReservedPlatformProtocolKind(candidate);
		if (reservedProtocolKind) {
			return {
				atom: null,
				errors: [
					formatPlatformStageError(
						stage,
						new Error(`Unbranded platform adapter result: ${reservedProtocolKind}`)
					),
				],
				terminal: false,
			};
		}
		return { atom: candidate, errors: [], terminal: false };
	} catch (error) {
		return {
			atom: null,
			errors: [formatPlatformStageError(stage, error)],
			terminal: false,
		};
	}
}

function isResolverAtom(value: unknown): value is ResolverAtom {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const atom = value as Partial<ResolverAtom>;
	return (
		typeof atom.schemaType === 'string' &&
		typeof atom.category === 'string' &&
		typeof atom.title === 'string'
	);
}

function readReservedPlatformProtocolKind(value: unknown): string | undefined {
	if (typeof value !== 'object' || value === null || !('kind' in value)) {
		return undefined;
	}

	return value.kind === 'platform_stage_miss' || value.kind === 'platform_stage_outcome'
		? value.kind
		: undefined;
}

function finalizeStageAtom(
	atom: ResolverAtom,
	input: {
		pluginId: string;
		stage: PlatformFallbackStage;
		domain: PlatformDomain;
		attemptedStages: PlatformFallbackStage[];
		canonicalUrl: string;
		now: string;
	}
): ResolverAtom {
	const metadata = atom.metadata ?? {};
	const metadataRecord: Record<string, unknown> =
		metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
	const fallbackStage =
		typeof metadataRecord.fallbackStage === 'string' ? metadataRecord.fallbackStage : input.stage;
	const fallbackChain =
		Array.isArray(metadataRecord.fallbackChain) &&
		metadataRecord.fallbackChain.every((stage) => typeof stage === 'string')
			? [...metadataRecord.fallbackChain]
			: [...input.attemptedStages];

	return {
		...atom,
		source: atom.source ?? `platform-v0:${input.stage}`,
		metadata: {
			...metadataRecord,
			pluginId:
				typeof metadataRecord.pluginId === 'string' ? metadataRecord.pluginId : input.pluginId,
			provider:
				typeof metadataRecord.provider === 'string' ? metadataRecord.provider : input.domain,
			fetchedAt:
				typeof metadataRecord.fetchedAt === 'string' ? metadataRecord.fetchedAt : input.now,
			sourceUrl:
				typeof metadataRecord.sourceUrl === 'string'
					? metadataRecord.sourceUrl
					: input.canonicalUrl,
			platform: input.domain,
			fallbackStage,
			fallbackChain,
		},
	};
}

function isCredentialConfigured(credential: PlatformCredential | undefined): boolean {
	if (!credential) {
		return false;
	}

	if (credential.enabled === false) {
		return false;
	}

	return !!(
		credential.apiKey ||
		credential.token ||
		credential.clientId ||
		credential.clientSecret ||
		credential.enabled
	);
}

function normalizeError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}

	return new Error('Unknown platform stage error');
}

export function formatPlatformStageError(stage: string, error: unknown): string {
	const normalized = normalizeError(error);
	const reason = readPipelineErrorReason(error);
	if (reason && normalized.message.startsWith(reason)) {
		return `${stage}:${normalized.message}`;
	}

	return `${stage}:${reason ?? 'adapter_error'}: ${normalized.message}`;
}

function readPipelineErrorReason(error: unknown): string | undefined {
	if (typeof error !== 'object' || error === null || !('reason' in error)) {
		return undefined;
	}

	return isPipelineErrorKind(error.reason) ? error.reason : undefined;
}
