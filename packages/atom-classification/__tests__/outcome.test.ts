import { describe, expect, it } from 'bun:test';
import { classifyOutcome } from '../src/outcome';
import { createPlainTextPlugin } from '../src/plugins/plain-text';
import { createTypeProfilesPlugin } from '../src/plugins/type-profiles';
import { createServerEngine } from '../src/server';

const input = { input: 'a public atom', mode: 'server-only' as const };
describe('classifyOutcome', () => {
	it('works without an error observer and preserves the result', async () => {
		const engine = createServerEngine({
			plugins: [createTypeProfilesPlugin(), createPlainTextPlugin()],
		});
		const outcome = await classifyOutcome(engine, input);
		expect(outcome.kind).toBe('success');
	});
	it('captures schema failures', async () => {
		const outcome = await classifyOutcome(createServerEngine({ plugins: [] }), { input: '' });
		expect(outcome.kind).toBe('failure');
	});
	it('captures pre-aborted runs without invoking classifiers', async () => {
		const signal = AbortSignal.abort('stop');
		const result = await classifyOutcome(createServerEngine({ plugins: [] }), input, { signal });
		expect(result.kind).toBe('failure');
		if (result.kind === 'failure') expect((result.error as Error).name).toBe('AbortError');
	});
});

it('delivers classifier errors to an optional async observer and contains observer failures', async () => {
	const failures: unknown[] = [];
	const plugin = createPlainTextPlugin();
	const engine = createServerEngine({
		plugins: [
			createTypeProfilesPlugin(),
			{
				...plugin,
				classifiers: plugin.classifiers?.map((classifier) => ({
					...classifier,
					classify() {
						throw new Error('classifier failed');
					},
				})),
			},
		],
		onClassifierError: async (error) => {
			failures.push(error);
			throw new Error('observer failed');
		},
	});
	const result = await classifyOutcome(engine, input);
	expect(result.kind).toBe('success');
	expect(failures.length).toBeGreaterThan(0);
	expect(failures[0]).toMatchObject({ message: 'classifier failed', pluginId: plugin.manifest.id });
});

it('aborts a pending resolver and prevents subsequent resolvers from running', async () => {
	let entered!: () => void;
	const started = new Promise<void>((resolve) => {
		entered = resolve;
	});
	let observed: AbortSignal | undefined;
	let laterCalls = 0;
	const plugin = createPlainTextPlugin();
	const engine = createServerEngine({
		plugins: [
			createTypeProfilesPlugin(),
			{
				...plugin,
				resolvers: [
					{
						id: 'pending',
						priority: 1,
						canResolve: () => true,
						resolve: (context) => {
							observed = context.signal;
							entered();
							return new Promise<never>(() => {});
						},
					},
					{
						id: 'later',
						priority: 2,
						canResolve: () => true,
						resolve: () => {
							laterCalls++;
							return null;
						},
					},
				],
			},
		],
	});
	const controller = new AbortController();
	const task = engine.classify(input, { signal: controller.signal });
	await started;
	controller.abort('cancel-request');
	await expect(task).rejects.toMatchObject({ name: 'AbortError', reason: 'cancel-request' });
	expect(observed?.aborted).toBe(true);
	expect(laterCalls).toBe(0);
});
