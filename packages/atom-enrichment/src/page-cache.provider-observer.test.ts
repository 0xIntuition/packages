import { describe, expect, test } from 'bun:test';
import { createRunPageCache } from './page-cache';

const none = {};
const tick = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms));

/** A loader whose work the test releases, which records whether the shared request was aborted. */
function gatedLoader() {
	let release: (value?: string) => void = () => undefined;
	const gate = new Promise<string>((resolve) => {
		release = (value = 'done') => resolve(value);
	});
	const state = { loads: 0, aborted: false, abortReason: undefined as unknown };
	const load = async (shared: { signal: AbortSignal }) => {
		state.loads += 1;
		shared.signal.addEventListener('abort', () => {
			state.aborted = true;
			state.abortReason = shared.signal.reason;
		});
		return await Promise.race([
			gate,
			new Promise<never>((_, reject) =>
				shared.signal.addEventListener('abort', () => reject(shared.signal.reason))
			),
		]);
	};
	return { load, release, state };
}

describe('createRunPageCache', () => {
	test('concurrent callers share one load; the first is live, the rest cache', async () => {
		const cache = createRunPageCache();
		let loads = 0;
		let release: () => void = () => undefined;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const load = async () => {
			loads += 1;
			await gate;
			return { n: loads };
		};
		const calls = [
			cache.getOrLoad('k', none, load),
			cache.getOrLoad('k', none, load),
			cache.getOrLoad('k', none, load),
		];
		release();
		const results = await Promise.all(calls);
		expect(loads).toBe(1);
		expect(results.map((r) => r.source)).toEqual(['live', 'cache', 'cache']);
		// The same settled outcome object, not a copy.
		expect(results[1]?.outcome).toBe(results[0]?.outcome);
	});

	test('different keys load separately', async () => {
		const cache = createRunPageCache();
		let loads = 0;
		const load = async () => ++loads;
		await cache.getOrLoad('a', none, load);
		await cache.getOrLoad('b', none, load);
		expect(loads).toBe(2);
	});

	test('a settled outcome is served to a later caller as cache', async () => {
		const cache = createRunPageCache();
		const first = await cache.getOrLoad('k', none, async () => 'one');
		const later = await cache.getOrLoad('k', none, async () => 'two');
		expect(first).toEqual({ outcome: 'one', source: 'live' });
		expect(later).toEqual({ outcome: 'one', source: 'cache' });
	});

	test('a loader that throws does not strand later callers on a rejected entry', async () => {
		const cache = createRunPageCache();
		await expect(
			cache.getOrLoad('k', none, async () => {
				throw new Error('boom');
			})
		).rejects.toThrow('boom');
		const retry = await cache.getOrLoad('k', none, async () => 'ok');
		expect(retry).toEqual({ outcome: 'ok', source: 'live' });
	});

	test('two caches never share entries', async () => {
		const a = createRunPageCache();
		const b = createRunPageCache();
		await a.getOrLoad('k', none, async () => 1);
		expect((await b.getOrLoad('k', none, async () => 2)).source).toBe('live');
	});

	test('exposes the run consumers it was created with', () => {
		expect([...createRunPageCache({ consumers: ['a', 'b'] }).consumers]).toEqual(['a', 'b']);
		expect(createRunPageCache().consumers.size).toBe(0);
	});
});

describe('the shared request outlives a consumer that gives up (ENG-16980 review)', () => {
	test('one consumer aborting fails only that consumer; the request goes on for the other', async () => {
		const cache = createRunPageCache();
		const { load, release, state } = gatedLoader();
		const impatient = new AbortController();
		const first = cache.getOrLoad('k', { signal: impatient.signal }, load);
		const second = cache.getOrLoad('k', none, load);
		const firstOutcome = first.catch((error: unknown) => error);
		impatient.abort(new Error('first gave up'));
		expect(((await firstOutcome) as Error).message).toBe('first gave up');
		await tick();
		expect(state.aborted).toBe(false);
		release('page');
		expect(await second).toEqual({ outcome: 'page', source: 'cache' });
		expect(state.loads).toBe(1);
	});

	test('the request is aborted only once EVERY consumer has aborted', async () => {
		const cache = createRunPageCache();
		const { load, state } = gatedLoader();
		const a = new AbortController();
		const b = new AbortController();
		const c = new AbortController();
		const calls = [a, b, c].map((controller) =>
			cache.getOrLoad('k', { signal: controller.signal }, load).catch((error: unknown) => error)
		);
		a.abort(new Error('a'));
		b.abort(new Error('b'));
		await tick();
		expect(state.aborted).toBe(false);
		c.abort(new Error('c'));
		await tick();
		expect(state.aborted).toBe(true);
		expect((await Promise.all(calls)).map((e) => (e as Error).message)).toEqual(['a', 'b', 'c']);
	});

	test('consumers with no signal keep the request alive when the others abort', async () => {
		const cache = createRunPageCache();
		const { load, release, state } = gatedLoader();
		const a = new AbortController();
		const aborted = cache.getOrLoad('k', { signal: a.signal }, load).catch(() => 'aborted');
		const patient = cache.getOrLoad('k', none, load);
		a.abort();
		await aborted;
		await tick();
		expect(state.aborted).toBe(false);
		release('page');
		expect((await patient).outcome).toBe('page');
	});

	test('a consumer that arrives after everyone aborted starts a fresh request', async () => {
		const cache = createRunPageCache();
		const first = gatedLoader();
		const a = new AbortController();
		const dead = cache.getOrLoad('k', { signal: a.signal }, first.load).catch(() => 'aborted');
		a.abort();
		await dead;
		await tick();
		expect(first.state.aborted).toBe(true);
		const second = gatedLoader();
		const fresh = cache.getOrLoad('k', none, second.load);
		second.release('fresh page');
		expect(await fresh).toEqual({ outcome: 'fresh page', source: 'live' });
		expect(second.state.loads).toBe(1);
	});

	test('a consumer whose signal is already aborted never leaves the request running', async () => {
		const cache = createRunPageCache();
		const { load, state } = gatedLoader();
		const aborted = AbortSignal.abort(new Error('already'));
		await expect(cache.getOrLoad('k', { signal: aborted }, load)).rejects.toThrow('already');
		await tick();
		expect(state.aborted).toBe(true);
	});

	test('an abort after the request settled changes nothing', async () => {
		const cache = createRunPageCache();
		const { load, release, state } = gatedLoader();
		const a = new AbortController();
		const call = cache.getOrLoad('k', { signal: a.signal }, load);
		release('page');
		expect((await call).outcome).toBe('page');
		a.abort();
		await tick();
		expect(state.aborted).toBe(false);
		expect((await cache.getOrLoad('k', none, load)).source).toBe('cache');
	});
});
