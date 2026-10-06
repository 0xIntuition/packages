import { afterAll, expect, test } from 'bun:test';
import { knownDivergences } from '../known-divergences';
import { type ProofCase, proofs } from './proofs';
import { assertDefined, assertInventory, equal, fingerprint, manifest, normal } from './vectors';

export function validateDivergences(cases: ProofCase[], entries = knownDivergences) {
	const divergenceIds = new Set<string>();
	for (const d of entries) {
		const c = cases.find((candidate) => candidate.id === d.id);
		if (!c || c.open || divergenceIds.has(d.id)) {
			throw new Error(`Invalid or stale divergence registration: ${d.id}`);
		}
		divergenceIds.add(d.id);
	}
}
validateDivergences(Object.values(proofs).flat());
for (const [name, cases] of Object.entries(proofs)) {
	assertInventory(
		`proof/${name}`,
		cases.map((c) => c.id),
		manifest.proofs[name]
	);
}
if (!equal(Object.keys(proofs).sort(), Object.keys(manifest.proofs).sort()))
	throw new Error('Proof file inventory drift');

export function enumerationTable() {
	const rows = Object.entries(proofs).map(([name, cases]) => {
		const open = cases.filter((c) => c.open).length;
		const divergences = knownDivergences.filter((d) => cases.some((c) => c.id === d.id)).length;
		const executed = cases.length - open;
		return `| ${name}.test.ts | ${cases.length} | ${executed} | ${executed - divergences} | ${divergences} | ${open} |`;
	});
	return [
		'| Proof file | Registered | Executed | Agreements | Divergences | OPEN |',
		'| --- | ---: | ---: | ---: | ---: | ---: |',
		...rows,
	].join('\n');
}

export function assertComparison(c: ProofCase, result: unknown) {
	assertDefined(result);
	assertDefined(c.expected);
	const actual = normal(result);
	const expected = normal(c.expected);
	const divergence = knownDivergences.find((d) => d.id === c.id);
	if (divergence) {
		expect(divergence.side.length).toBeGreaterThan(0);
		expect(divergence.reason.length).toBeGreaterThan(0);
		expect(divergence.removeWhen.length).toBeGreaterThan(0);
		expect(fingerprint(actual)).toBe(divergence.actualHash);
		expect(fingerprint(expected)).toBe(divergence.expectedHash);
		expect(equal(actual, expected)).toBe(false);
	} else {
		expect(actual).toStrictEqual(expected);
	}
	return divergence ? 'divergences' : 'agree';
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
				counts[assertComparison(c, await c.run())]++;
			} catch (error) {
				counts.fail++;
				throw error;
			}
		});
	}
	afterAll(() => {
		expect(counts.agree + counts.divergences + counts.fail).toBe(cases.length - counts.open);
		expect(counts.divergences).toBe(
			knownDivergences.filter((d) => cases.some((c) => c.id === d.id)).length
		);
		console.log(
			`${name}: registered=${cases.length} executed=${counts.agree + counts.divergences + counts.fail} agree=${counts.agree} known-divergence=${counts.divergences} fail=${counts.fail} OPEN=${counts.open}`
		);
	});
}
