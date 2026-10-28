import { describe, expect, it } from 'bun:test';
import type {
	AtomClassificationPlugin,
	ResolverContext,
} from '@0xintuition/atom-classification/plugins';
import type {
	EnrichmentPlugin,
	EnrichmentPluginContext,
} from '@0xintuition/atom-enrichment/plugins';
import { createMockRequest } from '@0xintuition/atom-enrichment/testing';

import {
	createAtomServicesProcessingRuntime,
	createTrpcLocalProcessingRuntime,
	type ProcessingRuntime,
} from '../src';

type Surface = {
	name: string;
	create: (
		env: Record<string, string | undefined>,
		secrets?: Readonly<Record<string, string>>
	) => ProcessingRuntime;
};

const SURFACES: Surface[] = [
	{
		name: 'tRPC-local',
		create: (env, secrets) =>
			createTrpcLocalProcessingRuntime(
				{ ENRICHMENT_CACHE_PROVIDER: 'none', ...env },
				{
					classification: { onClassifierError: () => undefined },
					...(secrets === undefined ? {} : { secrets }),
				}
			),
	},
	{
		name: 'atom-services',
		create: (env, secrets) =>
			createAtomServicesProcessingRuntime({
				env,
				cacheProvider: 'none',
				onClassifierError: () => undefined,
				...(secrets === undefined ? {} : { secrets }),
			}),
	},
];

describe('processing-runtime engine-context secrets parity', () => {
	for (const surface of SURFACES) {
		it(`${surface.name} keeps env credentials out of engine contexts by default`, async () => {
			const runtime = surface.create({ TMDB_API_KEY: 'synthetic-provider-credential' });
			const contexts = await captureEngineContexts(runtime, surface.name);

			expect(runtime.config.secrets).toBeUndefined();
			expect(contexts.enrichment.secrets).toBeUndefined();
			expect(contexts.classification.secrets).toBeUndefined();
		});

		it(`${surface.name} forwards only explicitly supplied engine secrets`, async () => {
			const runtime = surface.create({ TMDB_API_KEY: 'synthetic-provider-credential' }, { X: '1' });
			const contexts = await captureEngineContexts(runtime, `${surface.name}-explicit`);

			expect(Object.keys(runtime.config.secrets ?? {})).toEqual(['X']);
			expect(contexts.enrichment.secrets).toBeDefined();
			expect(Object.keys(contexts.enrichment.secrets ?? {})).toEqual(['X']);
			expect(contexts.classification.secrets).toBeDefined();
			expect(Object.keys(contexts.classification.secrets ?? {})).toEqual(['X']);
		});

		it(`${surface.name} fingerprints env and explicit service key presence separately`, () => {
			const absent = surface.create({});
			const environmentPresent = surface.create({
				TMDB_API_KEY: 'synthetic-provider-credential',
			});
			const serviceFirst = surface.create({}, { X: '1' });
			const serviceSecond = surface.create({}, { X: '2' });

			expect(environmentPresent.fingerprint).not.toBe(absent.fingerprint);
			expect(serviceFirst.fingerprint).not.toBe(absent.fingerprint);
			expect(serviceSecond.fingerprint).toBe(serviceFirst.fingerprint);
		});
	}
});

async function captureEngineContexts(
	runtime: ProcessingRuntime,
	id: string
): Promise<{
	enrichment: Pick<EnrichmentPluginContext, 'secrets'>;
	classification: Pick<ResolverContext, 'secrets'>;
}> {
	let enrichmentContext: EnrichmentPluginContext | undefined;
	const enrichmentPlugin = createEnrichmentPresencePlugin(
		`fix2-enrichment-${normalizeId(id)}`,
		(context) => {
			enrichmentContext = context;
		}
	);
	const enrichmentEngine = runtime.enrichment.createEngine('academic');
	enrichmentEngine.registerPlugin(enrichmentPlugin);
	await enrichmentEngine.enrich(
		createMockRequest({
			plugins: [enrichmentPlugin.id],
		})
	);

	let classificationContext: ResolverContext | undefined;
	const classificationPlugin = createClassificationPresencePlugin(
		`fix2-classification-${normalizeId(id)}`,
		(context) => {
			classificationContext = context;
		}
	);
	const classificationEngine = runtime.classification.createEngine();
	classificationEngine.registerPlugin(classificationPlugin);
	await classificationEngine.classify({
		input: 'fix round 2 context probe',
		mode: 'client-only',
		classificationSessionId: `fix2-${normalizeId(id)}`,
		pluginIds: [classificationPlugin.manifest.id],
	});

	if (!(enrichmentContext && classificationContext)) {
		throw new Error('Both context probes must execute.');
	}

	return {
		enrichment: { secrets: enrichmentContext.secrets },
		classification: { secrets: classificationContext.secrets },
	};
}

function createEnrichmentPresencePlugin(
	id: string,
	capture: (context: EnrichmentPluginContext) => void
): EnrichmentPlugin {
	return {
		id,
		version: '1.0.0',
		runtime: 'server',
		artifactTypes: ['opengraph'],
		supports: () => true,
		enrich: async (_request, context) => {
			capture(context);
			return [];
		},
	};
}

function createClassificationPresencePlugin(
	id: string,
	capture: (context: ResolverContext) => void
): AtomClassificationPlugin {
	return {
		manifest: {
			id,
			version: '1.0.0',
			engineRange: '*',
			runtime: 'server',
			capabilities: [],
			permissions: [],
			dependsOn: [],
			provides: [],
			priority: 0,
		},
		classifiers: [
			{
				id: `${id}-classifier`,
				priority: 0,
				classify: () => ({
					type: 'text',
					domain: 'fix2',
					subtype: 'probe',
					confidence: 1,
					meta: {},
				}),
			},
		],
		resolvers: [
			{
				id: `${id}-resolver`,
				priority: 0,
				executionMode: 'deterministic',
				canResolve: () => true,
				resolve: (context) => {
					capture(context);
					return undefined;
				},
			},
		],
	};
}

function normalizeId(value: string): string {
	return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
}
