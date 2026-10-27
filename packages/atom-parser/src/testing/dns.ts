import { createRequire } from 'node:module';

/**
 * Makes every public hostname resolve to one fixed public address for the tests of the calling
 * file, and puts the real module back afterwards.
 *
 * The shared provider hop resolves each target through `node:dns/promises` before it dials, so a
 * real lookup would make a provider test depend on the network. `mock.module` is process-global
 * in Bun: registering it for the whole run would leak into every later file, which is why this
 * is scoped to `beforeAll`/`afterAll` (the hop imports the module at call time, so a hook-time
 * registration is seen).
 */
export function useStubbedPublicDns(address = '93.184.216.34'): void {
	const { afterAll, beforeAll, mock } = createRequire(import.meta.url)(
		'bun:test'
	) as typeof import('bun:test');
	let realDns: typeof import('node:dns/promises') | undefined;
	beforeAll(async () => {
		realDns = await import('node:dns/promises');
		const real = realDns;
		// mock-module-exempt: no socket is opened; only the name lookup is replaced, and restored below.
		mock.module('node:dns/promises', () => ({
			...real,
			default: real,
			lookup: async () => [{ address, family: 4 }],
		}));
	});
	afterAll(() => {
		const real = realDns;
		if (!real) return;
		// mock-module-exempt: restores the real module registered in beforeAll.
		mock.module('node:dns/promises', () => ({ ...real, default: real }));
	});
}
