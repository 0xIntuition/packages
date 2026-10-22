import { expect, spyOn, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { assertComparison, enumerationTable, validateDivergences } from './support/assertions';
import { canonicalCases, parseCases, proofs } from './support/proofs';
import { iid } from './support/public';
import { canonicalization, equal, loadVectors } from './support/vectors';

function corpusCopy() {
	return structuredClone(canonicalization);
}

test('empty public parser object fails corpus-train:parse-009', async () => {
	const proof = canonicalCases.find((c) => c.id === 'corpus-train:parse-009')!;
	const mock = spyOn(iid, 'parseIntuitionId').mockReturnValue({});
	try {
		await expect((async () => assertComparison(proof, await proof.run()))()).rejects.toThrow();
	} finally {
		mock.mockRestore();
	}
});

for (const result of [
	null,
	{ scheme: null, value: null },
	{ scheme: 'isbn' },
	{ scheme: undefined, value: undefined },
]) {
	test(`unexpected public parser shape ${JSON.stringify(result)} fails rejection proof`, async () => {
		const proof = canonicalCases.find((c) => c.id === 'corpus-train:parse-009')!;
		const mock = spyOn(iid, 'parseIntuitionId').mockReturnValue(result);
		try {
			await expect((async () => assertComparison(proof, await proof.run()))()).rejects.toThrow();
		} finally {
			mock.mockRestore();
		}
	});
}

test('recorded reference undefined cannot replace explicit canonical null', () => {
	const value = corpusCopy();
	value.cases.find((c: any) => c.id === 'canon-acct-093').referenceOutput.canonical = undefined;
	expect(() => {
		loadVectors('canonicalization-vectors', value);
	}).toThrow();
});

test('undefined canonical fails the explicit null in iid_invalid_isrc_value', async () => {
	const proof = parseCases.find((c) => c.id === 'iid_invalid_isrc_value')!;
	const result = { ...(await proof.run()), canonical: undefined };
	expect(() => assertComparison(proof, result)).toThrow();
});

test('undefined and a missing field cannot equal null or each other', () => {
	expect(equal({ canonical: undefined }, { canonical: null })).toBe(false);
	expect(equal({ canonical: undefined }, {})).toBe(false);
	expect(equal([undefined], [null])).toBe(false);
});

test('truncation to parse-009 and parse-010 fails the inventory', () => {
	const value = corpusCopy();
	value.cases = value.cases.filter((c: any) => ['parse-009', 'parse-010'].includes(c.id));
	expect(() => {
		loadVectors('canonicalization-vectors', value);
	}).toThrow();
});

test('flipped canon-acct-090 agrees flag fails the loaded proof', () => {
	const value = corpusCopy();
	value.cases.find((c: any) => c.id === 'canon-acct-090').agrees = false;
	expect(() => {
		loadVectors('canonicalization-vectors', value);
	}).toThrow();
});

test('disagreements list must equal the agrees false id set', () => {
	const value = corpusCopy();
	value.disagreements.pop();
	expect(() => {
		loadVectors('canonicalization-vectors', value);
	}).toThrow();
});

test('same-sized corpus with a replaced id fails the inventory', () => {
	const value = corpusCopy();
	value.cases[0].id = 'unexpected-vector';
	expect(() => {
		loadVectors('canonicalization-vectors', value);
	}).toThrow();
});

test('duplicate ids fail even when the count is unchanged', () => {
	const value = corpusCopy();
	value.cases[0].id = value.cases[1].id;
	expect(() => {
		loadVectors('canonicalization-vectors', value);
	}).toThrow();
});

test('moving a vector between corpora fails each corpus inventory', () => {
	const value = corpusCopy();
	value.cases[0].corpusFile = 'parse.json';
	expect(() => {
		loadVectors('canonicalization-vectors', value);
	}).toThrow();
});

for (const name of ['atom-parser-contract-fixtures', 'anchor-vectors', 'ladder-vectors']) {
	test(`${name} cannot silently lose a case`, () => {
		const value = structuredClone(loadVectors(name));
		value.cases.pop();
		expect(() => {
			loadVectors(name, value);
		}).toThrow();
	});
}

test('direct validator inventory cannot shrink', () => {
	const value = structuredClone(loadVectors('anchor-vectors'));
	value.validators.pop();
	expect(() => {
		loadVectors('anchor-vectors', value);
	}).toThrow();
});

test('ladder structure inventory cannot shrink', () => {
	const value = structuredClone(loadVectors('ladder-vectors'));
	delete value.ladders.person;
	expect(() => {
		loadVectors('ladder-vectors', value);
	}).toThrow();
});

test('golden fixture identity cannot change unnoticed', () => {
	const value = structuredClone(loadVectors('golden-fixture'));
	value.iid = 'int:isrc:GBARL9300135';
	expect(() => {
		loadVectors('golden-fixture', value);
	}).toThrow();
});

test('orphan divergence fails against the actual loaded proof set', () => {
	const cases = Object.values(proofs)
		.flat()
		.filter((c) => c.id !== 'parse-009');
	expect(() => validateDivergences(cases)).toThrow('parse-009');
});

test('README counts every excluded typed-wd parser case from the corpus inventory', () => {
	const corpus = loadVectors('parser-corpus-inventory');
	const count = corpus.cases.filter((c: any) => c.name.startsWith('iid_typed_wd_')).length;
	const readme = readFileSync(new URL('./README.md', import.meta.url), 'utf8');
	console.log(`typed-wd parser cases excluded from C1: ${count}`);
	expect(count).toBeGreaterThan(0);
	expect(readme).toContain(
		`${count} parser-corpus cases excluded from C1 at this base; enter with the typed-wd stack`
	);
});

test('README runtime enumeration equals the registered proof inventory', () => {
	const readme = readFileSync(new URL('./README.md', import.meta.url), 'utf8');
	expect(readme).toContain(enumerationTable());
});
