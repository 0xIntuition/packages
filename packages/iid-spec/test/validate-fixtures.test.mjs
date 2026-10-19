import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateCorpus } from './validate-fixtures.mjs';

const corpus = Object.fromEntries(
	['canonicalization', 'norm1', 'gen1', 'parse', 'validation', 'schemes'].map((name) => [
		name,
		JSON.parse(readFileSync(new URL(`../conformance/${name}.json`, import.meta.url), 'utf8')),
	])
);

test('shipped corpus passes standalone validation', () => {
	assert.match(validateCorpus(structuredClone(corpus)), /corpus OK: 170 vectors/);
});

for (const [id, anchorEligible] of [
	['valid-acct-weak', true],
	['valid-acct-strong', false],
]) {
	test(`rejects ${id} with anchorEligible = ${anchorEligible} and names the vector`, () => {
		const mutated = structuredClone(corpus);
		mutated.validation.vectors.find((vector) => vector.id === id).anchorEligible = anchorEligible;
		assert.throws(() => validateCorpus(mutated), new RegExp(`${id}: anchorEligible`));
	});
}
