import { parseIntuitionId, SCHEME_NAMES, validateIntuitionId } from '@0xintuition/iid';
import type { Outcome } from '@0xintuition/pipeline-runtime/outcome';
import { z } from 'zod/v4';
import type { CacheAdapter } from './cache';
import type { ClassificationRegistry } from './classifications';
import { resolveIdentifierHints } from './identifier';
import type { EnrichmentNetworkOptions } from './network';
import type { RegisterPluginOptions, ResolvePluginsResult } from './plugin-registry';
import type { EnrichmentPlugin, EnrichmentPluginLogger } from './plugins';

const slugPattern = /^[a-z][a-z0-9-]{0,38}[a-z0-9]$/;

export const atomTypeSchema = z.enum([
	'person',
	'place',
	'thing',
	'company',
	'product',
	'podcast',
	'song',
	'software',
	'unknown',
]);

export const enrichmentRuntimeSchema = z.enum(['client', 'server']);

export const pluginRuntimeSchema = z.enum(['client', 'server', 'universal']);

export const rawInputKindSchema = z.enum(['url', 'plain-text', 'iid']);

export const githubTargetSchema = z.discriminatedUnion('kind', [
	z
		.object({
			kind: z.literal('repo'),
			owner: z.string().min(1).max(256),
			repo: z.string().min(1).max(256),
		})
		.strict(),
	z
		.object({
			kind: z.literal('user'),
			login: z.string().min(1).max(256),
		})
		.strict(),
]);

export const amazonTargetSchema = z.discriminatedUnion('kind', [
	z
		.object({
			kind: z.literal('product'),
			asin: z.string().length(10),
			canonicalUrl: z.string().url(),
			marketplace: z.string().min(2).max(8).optional(),
		})
		.strict(),
	z
		.object({
			kind: z.literal('storefront'),
			canonicalUrl: z.string().url(),
		})
		.strict(),
]);

export const xTargetSchema = z.discriminatedUnion('kind', [
	z
		.object({
			kind: z.literal('profile'),
			handle: z.string().min(1).max(256),
			canonicalUrl: z.string().url(),
		})
		.strict(),
	z
		.object({
			kind: z.literal('post'),
			handle: z.string().min(1).max(256).optional(),
			postId: z.string().min(1).max(256),
			canonicalUrl: z.string().url(),
		})
		.strict(),
]);

export const classifiedAtomTargetsSchema = z
	.object({
		github: githubTargetSchema.optional(),
		amazon: amazonTargetSchema.optional(),
		x: xTargetSchema.optional(),
	})
	.strict();

export const classifiedAtomPolicySchema = z
	.object({
		rawInputKind: rawInputKindSchema,
		allowUrlOnlyProviders: z.boolean(),
	})
	.strict();

export const classificationSlugLikeSchema = z
	.string()
	.min(2)
	.max(40)
	.regex(
		slugPattern,
		'Classification slug must be lowercase alphanumeric with hyphens (2-40 chars).'
	);

export const classifiedAtomIdentifierSchema = z
	.object({
		iid: z.string().min(1).max(257),
		scheme: z.enum(SCHEME_NAMES),
		value: z.string().min(1).max(220),
		anchorEligible: z.boolean().optional(),
	})
	.strict()
	.superRefine((identifier, context) => {
		const parsed = parseIntuitionId(identifier.iid);
		if (!parsed || !validateIntuitionId(identifier.iid)) {
			context.addIssue({
				code: 'custom',
				message: 'Identifier IID must be registered and canonical.',
				path: ['iid'],
			});
			return;
		}

		if (parsed.scheme !== identifier.scheme) {
			context.addIssue({
				code: 'custom',
				message: 'Identifier scheme must match the IID scheme.',
				path: ['scheme'],
			});
		}

		if (parsed.value !== identifier.value) {
			context.addIssue({
				code: 'custom',
				message: 'Identifier value must match the canonical IID value.',
				path: ['value'],
			});
		}
	});

export const classifiedAtomInputSchema = z
	.object({
		atomType: atomTypeSchema,
		jsonLd: z.record(z.string(), z.unknown()).optional(),
		identifier: classifiedAtomIdentifierSchema.optional(),
		source: z
			.object({
				classificationEngine: z.string().min(1).max(128),
				classifiedAt: z.iso.datetime(),
				fallbackStage: z.string().min(1).max(128).optional(),
				provider: z.string().min(1).max(128).optional(),
			})
			.strict(),
		hints: z
			.object({
				name: z.string().min(1).max(512).optional(),
				description: z.string().min(1).max(2_000).optional(),
				url: z.string().url().optional(),
				identifiers: z.record(z.string(), z.string()).optional(),
				locale: z.string().min(2).max(20).optional(),
			})
			.strict()
			.optional(),
		targets: classifiedAtomTargetsSchema.optional(),
		policy: classifiedAtomPolicySchema.optional(),
	})
	.strict()
	.superRefine((input, context) => {
		if (!(input.jsonLd || input.identifier)) {
			context.addIssue({
				code: 'custom',
				message: 'Either jsonLd or identifier is required.',
				path: ['jsonLd'],
			});
		}
	})
	.transform((input) => {
		const identifiers = resolveIdentifierHints(input);

		return {
			...input,
			jsonLd: input.jsonLd ?? {},
			...(identifiers
				? {
						hints: {
							...(input.hints ?? {}),
							identifiers,
						},
					}
				: {}),
		};
	});

export const spotifyPrefetchedItemSchema = z
	.object({
		batchRequestId: z.string().min(1).max(256),
		batchSize: z.number().int().min(1).max(50),
		id: z.string().min(1).max(64),
		payload: z.record(z.string(), z.unknown()),
		type: z.enum(['track', 'album', 'artist', 'show', 'episode']),
	})
	.strict();

export const providerPrefetchSchema = z
	.object({
		spotify: spotifyPrefetchedItemSchema.optional(),
	})
	.strict();

export const enrichmentRequestSchema = z
	.object({
		input: classifiedAtomInputSchema,
		runtime: enrichmentRuntimeSchema,
		plugins: z.array(classificationSlugLikeSchema).max(128).optional(),
		artifactTypes: z.array(classificationSlugLikeSchema).max(128).optional(),
		artifactClasses: z.array(classificationSlugLikeSchema).max(128).optional(),
		concurrency: z.number().int().min(1).max(64).optional(),
		timeoutMs: z.number().int().min(1).max(120_000).optional(),
		traceId: z.string().min(1).max(128).optional(),
		providerPrefetch: providerPrefetchSchema.optional(),
	})
	.strict();

export const enrichmentArtifactMetaSchema = z
	.object({
		pluginId: classificationSlugLikeSchema,
		provider: z.string().min(1).max(128),
		fetchedAt: z.iso.datetime(),
		confidence: z.number().min(0).max(1).optional(),
		sourceUrl: z.string().url().optional(),
		identityStrength: z.literal('title').optional(),
		fromCache: z.boolean().optional(),
		cachedAt: z.iso.datetime().optional(),
		// Image-policy provenance stamped by the OpenGraph plugin (see image-policy.ts).
		imagePolicy: z
			.object({
				authorizedUrl: z.string().url().max(8192),
				kind: z.enum(['allowlisted', 'generic-user-pasted']),
			})
			.strict()
			.optional(),
	})
	.strict();

export const enrichmentArtifactSchema = z
	.object({
		artifact_type: classificationSlugLikeSchema,
		data: z.record(z.string(), z.unknown()),
		meta: enrichmentArtifactMetaSchema,
	})
	.strict();

export const pluginExecutionErrorCodeSchema = z.enum([
	'not_applicable',
	'runtime_mismatch',
	'timeout',
	'rate_limited',
	'auth_failed',
	'upstream_error',
	'validation_error',
	'internal_error',
]);

// ENG-16644 compatibility: remove after the next release.
// Legacy diagnostics are accepted only while parsing and never reach the projection.
const stripLegacyErrorDiagnostics = (value: unknown) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
	const {
		requestUrl: _requestUrl,
		bodyExcerpt: _bodyExcerpt,
		...details
	} = value as Record<string, unknown>;
	return details;
};

/** `details.errorClass` of a lookup our own pacing slot refused (ENG-17116). */
export const BUDGET_EXHAUSTED_ERROR_CLASS = 'budget_exhausted';

/** A lookup our own pacing slot turned away before anything was sent (ENG-17116): no HTTP exchange. */
export const slotRefusalErrorDetailsSchema = z
	.object({
		errorClass: z.literal(BUDGET_EXHAUSTED_ERROR_CLASS),
		retryAfterMs: z.number().int().min(0),
	})
	.strict();

/** An HTTP exchange failed: the status is always known. */
export const httpErrorDetailsSchema = z
	.object({
		status: z.number().int().min(100).max(599),
		retryAfterMs: z.number().int().min(0).optional(),
		// Old producers omit errorClass; use the producer's ordinary HTTP-error class.
		errorClass: z.string().min(1).max(64).default('provider_http_error'),
	})
	.strict();

// The refusal shape is tried first: it has no `status`, so an HTTP detail never matches it.
// Deploy order: consumers before producers. An older consumer parses only the HTTP shape and would
// reject a refusal (which has no `status`).
export const providerHttpErrorDetailsSchema = z.preprocess(
	stripLegacyErrorDiagnostics,
	z.union([slotRefusalErrorDetailsSchema, httpErrorDetailsSchema])
);

export const pluginExecutionErrorSchema = z
	.object({
		pluginId: classificationSlugLikeSchema,
		code: pluginExecutionErrorCodeSchema,
		message: z.string().min(1).max(2_000),
		retriable: z.boolean(),
		details: providerHttpErrorDetailsSchema.optional(),
	})
	.strict();

export const enrichmentSkippedPluginSchema = z
	.object({
		pluginId: classificationSlugLikeSchema,
		reason: z.string().min(1).max(256),
	})
	.strict();

export const enrichmentRunResultSchema = z
	.object({
		status: z.enum(['success', 'partial', 'failed']),
		artifacts: z.array(enrichmentArtifactSchema),
		errors: z.array(pluginExecutionErrorSchema),
		skipped: z.array(enrichmentSkippedPluginSchema),
		timings: z
			.object({
				startedAt: z.iso.datetime(),
				finishedAt: z.iso.datetime(),
				durationMs: z.number().int().min(0),
				perPluginMs: z.record(z.string(), z.number().int().min(0)),
				cacheHits: z.number().int().min(0).default(0),
				cacheMisses: z.number().int().min(0).default(0),
			})
			.strict(),
		traceId: z.string().min(1).max(128).optional(),
	})
	.strict();

export type AtomType = z.infer<typeof atomTypeSchema>;
export type EnrichmentRuntime = z.infer<typeof enrichmentRuntimeSchema>;
export type PluginRuntime = z.infer<typeof pluginRuntimeSchema>;
export type RawInputKind = z.infer<typeof rawInputKindSchema>;
export type GitHubTarget = z.infer<typeof githubTargetSchema>;
export type AmazonTarget = z.infer<typeof amazonTargetSchema>;
export type XTarget = z.infer<typeof xTargetSchema>;
export type ClassifiedAtomTargets = z.infer<typeof classifiedAtomTargetsSchema>;
export type ClassifiedAtomPolicy = z.infer<typeof classifiedAtomPolicySchema>;
export type ClassifiedAtomIdentifier = z.infer<typeof classifiedAtomIdentifierSchema>;
export type ClassifiedAtomInput = z.input<typeof classifiedAtomInputSchema>;
export type EnrichmentRequestInput = z.input<typeof enrichmentRequestSchema>;
export type EnrichmentRequest = z.output<typeof enrichmentRequestSchema>;
export type ProviderPrefetch = z.infer<typeof providerPrefetchSchema>;
export type SpotifyPrefetchedItem = z.infer<typeof spotifyPrefetchedItemSchema>;
export type EnrichmentArtifactMeta = z.infer<typeof enrichmentArtifactMetaSchema>;
export type EnrichmentArtifact = z.infer<typeof enrichmentArtifactSchema>;
export type PluginExecutionErrorCode = z.infer<typeof pluginExecutionErrorCodeSchema>;
export type ProviderHttpErrorDetails = z.infer<typeof providerHttpErrorDetailsSchema>;
export type HttpErrorDetails = z.infer<typeof httpErrorDetailsSchema>;
export type SlotRefusalErrorDetails = z.infer<typeof slotRefusalErrorDetailsSchema>;
export type PluginExecutionError = z.infer<typeof pluginExecutionErrorSchema>;
export type EnrichmentSkippedPlugin = z.infer<typeof enrichmentSkippedPluginSchema>;
export type EnrichmentRunResult = z.infer<typeof enrichmentRunResultSchema>;

/** Stable host-owned identity policy included in unversioned plugin cache keys. */
export type EnrichmentIdentityPolicy = { fingerprint: string };
export type EnrichmentIdentityCapability = EnrichmentIdentityPolicy & {
	resolveWikidataSchemaType(p31EntityIds: string[]): string | undefined;
};
export type { EnrichmentPluginContext } from './plugins';
export type EnrichRunOptions = { signal?: AbortSignal };
export type EnrichmentPipelineResult = EnrichmentRunResult;
export type EnrichmentEngineConfig = {
	network?: EnrichmentNetworkOptions;
	plugins?: EnrichmentPlugin[];
	identity?: EnrichmentIdentityCapability;
	concurrency?: number;
	timeoutMs?: number;
	classifications?: ClassificationRegistry;
	logger?: EnrichmentPluginLogger;
	now?: () => string;
	random?: () => number;
	secrets?: Record<string, string>;
	cache?: CacheAdapter;
};
export type EnrichmentEngine = {
	registerPlugin(plugin: EnrichmentPlugin, options?: RegisterPluginOptions): void;
	unregisterPlugin(pluginId: string): boolean;
	listPlugins(): EnrichmentPlugin[];
	resolvePlugins(request: EnrichmentRequestInput): ResolvePluginsResult;
	enrich(
		request: EnrichmentRequestInput,
		options?: EnrichRunOptions
	): Promise<EnrichmentPipelineResult>;
	enrichOutcome?(
		request: EnrichmentRequest,
		options?: EnrichRunOptions
	): Promise<Outcome<EnrichmentPipelineResult>>;
};
