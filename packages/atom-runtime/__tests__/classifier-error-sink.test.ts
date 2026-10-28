import { describe, expect, it } from 'bun:test';
import type { AtomClassificationPlugin } from '@0xintuition/atom-classification';
import {
	createAtomServicesProcessingRuntime,
	createProcessingRuntime,
	createTrpcLocalProcessingRuntime,
} from '../src';

const INPUT = {
	input: 'https://example.com/classifier-sink',
	mode: 'server-only' as const,
	classificationSessionId: 'classifier-sink-test',
};

// Port the portable reference delivery contract. App-owned bounded delivery
// queues and logger-backed sink accounting intentionally remain outside M3.
describe('optional classifier error observers', () => {
	it('composes each consumer without an observer', () => {
		expect(() => createProcessingRuntime({ env: {} })).not.toThrow();
		expect(() => createTrpcLocalProcessingRuntime({})).not.toThrow();
		expect(() => createAtomServicesProcessingRuntime({ env: {} })).not.toThrow();
	});
	for (const surface of ['direct', 'local', 'atom-services'] as const) {
		it(`${surface} delivers errors and contains asynchronous observer failures`, async () => {
			const errors: unknown[] = [];
			const onClassifierError = async (error: unknown) => {
				errors.push(error);
				throw new Error('observer failed');
			};
			const pluginOverrides = { classification: createFailureThenSuccessPlugin() };
			const runtime =
				surface === 'direct'
					? createProcessingRuntime(
							{ env: {}, classification: { onClassifierError } },
							{ pluginOverrides }
						)
					: surface === 'local'
						? createTrpcLocalProcessingRuntime(
								{},
								{ classification: { onClassifierError }, pluginOverrides }
							)
						: createAtomServicesProcessingRuntime({ env: {}, onClassifierError, pluginOverrides });
			const result = await runtime.classification.engine().classify(INPUT);
			expect(result.status).toBe('complete');
			expect(errors).toHaveLength(1);
			expect(errors[0]).toMatchObject({
				classifierId: 'failing-classifier',
				pluginId: 'classifier-sink-plugin',
			});
		});
	}
});

function createFailureThenSuccessPlugin(): AtomClassificationPlugin[] {
	return [
		{
			manifest: {
				id: 'classifier-sink-plugin',
				version: '1.0.0',
				engineRange: '*',
				runtime: 'server',
				capabilities: [],
				permissions: [],
				dependsOn: [],
				provides: [],
				priority: 100,
			},
			classifiers: [
				{
					id: 'failing-classifier',
					priority: 1,
					classify: () => {
						throw new Error('sensitive classifier failure');
					},
				},
				{
					id: 'successful-classifier',
					priority: 2,
					classify: () => ({
						type: 'url',
						domain: 'example',
						subtype: 'thing',
						confidence: 1,
						meta: {},
					}),
				},
			],
			resolvers: [
				{
					id: 'classifier-sink-resolver',
					executionMode: 'deterministic',
					canResolve: () => true,
					resolve: () => ({
						atoms: [
							{
								schemaType: 'Thing',
								category: 'thing',
								title: 'Classifier sink atom',
								canonicalId: 'https://example.com/classifier-sink',
								sameAs: ['https://example.com/classifier-sink'],
								source: 'classifier-sink-test',
								confidence: 1,
								data: {},
							},
						],
					}),
				},
			],
		},
	];
}
