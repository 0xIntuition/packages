import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateCorpus } from './validate-fixtures.mjs';

const schema = JSON.parse(
	readFileSync(new URL('../conformance/schema.json', import.meta.url), 'utf8')
);

const corpus = Object.fromEntries(
	['canonicalization', 'norm1', 'gen1', 'parse', 'validation', 'schemes'].map((name) => [
		name,
		JSON.parse(readFileSync(new URL(`../conformance/${name}.json`, import.meta.url), 'utf8')),
	])
);

test('shipped corpus passes standalone validation', () => {
	assert.match(validateCorpus(structuredClone(corpus)), /corpus OK: 209 vectors/);
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

for (const count of [28, 30]) {
	test(`rejects a schema clone with ${count} scheme names and names the count`, () => {
		const mutated = structuredClone(schema);
		mutated.$defs.schemeName.enum = Array.from({ length: count }, (_, i) => `scheme-${i}`);
		assert.throws(
			() => validateCorpus(structuredClone(corpus), mutated),
			/schema must register exactly 29 schemes/
		);
	});
}
for (const scheme of ['podcast-index', 'apple-podcasts', 'letterboxd']) {
	test(`${scheme}: corpus registers a typed whole-scheme P1 floor`, () => {
		assert.deepEqual(corpus.schemes.schemes[scheme], {
			class: 'D',
			typing: 'unambiguous',
			anchorIneligibleValuePattern: '^[\\s\\S]*$',
		});
		const mutated = structuredClone(corpus);
		const vector = mutated.validation.vectors.find((v) => v.id === `valid-${scheme}`);
		vector.anchorEligible = true;
		assert.throws(() => validateCorpus(mutated), new RegExp(`valid-${scheme}: anchorEligible`));
	});
}
