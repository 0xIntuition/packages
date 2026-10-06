import { afterAll, expect, test } from 'bun:test';
import { knownDivergences } from '../known-divergences';
import { proofs } from './proofs';
import { equal, fingerprint, normal } from './vectors';

const allCases = Object.values(proofs).flat();
const divergenceIds = new Set<string>();
for (const d of knownDivergences) {
	const c = allCases.find((candidate) => candidate.id === d.id);
	if (!c || c.open || divergenceIds.has(d.id)) {
		throw new Error(`Invalid or stale divergence registration: ${d.id}`);
	}
	divergenceIds.add(d.id);
}

export function registerProof(name: string) {
	const cases = proofs[name];
	const counts = { agree: 0, divergences: 0, fail: 0, open: 0 };
	for (const c of cases) {
		if (c.open) {
			counts.open++;
			test.todo(`${c.id}: OPEN: ${c.open}`);
			continue;
		}
		test(c.id, async () => {
			try {
				const actual = normal(await c.run());
				const expected = normal(c.expected);
				const divergence = knownDivergences.find((d) => d.id === c.id);
				if (divergence) {
					expect(divergence.side.length).toBeGreaterThan(0);
					expect(divergence.reason.length).toBeGreaterThan(0);
					expect(divergence.removeWhen.length).toBeGreaterThan(0);
					expect(fingerprint(actual)).toBe(divergence.actualHash);
					expect(fingerprint(expected)).toBe(divergence.expectedHash);
					expect(equal(actual, expected)).toBe(false);
					counts.divergences++;
				} else {
					expect(actual).toEqual(expected);
					counts.agree++;
				}
			} catch (error) {
				counts.fail++;
				throw error;
			}
		});
	}
	afterAll(() =>
		console.log(
			`${name}: agree=${counts.agree} known-divergence=${counts.divergences} fail=${counts.fail} OPEN=${counts.open}`
		)
	);
}
