import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

interface Inventory {
	count: number;
	ids: string[];
}

export const manifest: {
	referenceSha: string;
	files: Record<string, Record<string, Inventory>>;
	proofs: Record<string, Inventory>;
} = JSON.parse(readFileSync(new URL('../vectors/manifest.json', import.meta.url), 'utf8'));

export const referenceSha = '31b62f35a787b6a7b9318f7a5d245ba6d0c76e9b';
if (manifest.referenceSha !== referenceSha) throw new Error('Manifest provenance drift');

export function assertInventory(name: string, ids: string[], expected: Inventory) {
	if (
		!expected ||
		ids.some((id) => typeof id !== 'string') ||
		new Set(ids).size !== ids.length ||
		ids.length !== expected.count ||
		!equal([...ids].sort(), expected.ids)
	) {
		throw new Error(`Inventory drift: ${name}`);
	}
}

function inventories(name: string, value: any): Record<string, string[]> {
	switch (name) {
		case 'atom-parser-contract-fixtures':
		case 'parser-corpus-inventory':
			return { cases: value.cases.map((c: any) => c.name) };
		case 'anchor-vectors':
			return {
				cases: value.cases.map((c: any) => c.label),
				validators: value.validators.map((c: any) => c.label),
			};
		case 'ladder-vectors':
			return {
				cases: value.cases.map((c: any) => `${c.slug}:${c.label}`),
				ladders: Object.keys(value.ladders),
			};
		case 'golden-fixture':
			return { fixture: [value.iid] };
		case 'canonicalization-vectors':
			return {
				cases: value.cases.map((c: any) => c.id),
				...Object.fromEntries(
					['canonicalization.json', 'parse.json', 'norm1.json', 'gen1.json'].map((corpus) => [
						corpus,
						value.cases.filter((c: any) => c.corpusFile === corpus).map((c: any) => c.id),
					])
				),
			};
		default:
			throw new Error(`Unregistered vector file: ${name}`);
	}
}

export function loadVectors(name: string, supplied?: any) {
	const value =
		supplied ??
		JSON.parse(readFileSync(new URL(`../vectors/${name}.json`, import.meta.url), 'utf8'));
	if (value.provenance.referenceSha !== referenceSha) throw new Error(`Provenance drift: ${name}`);
	assertDefined(value);
	const expected = manifest.files[name];
	const actual = inventories(name, value);
	if (!expected || !equal(Object.keys(actual).sort(), Object.keys(expected).sort()))
		throw new Error(`Inventory groups drift: ${name}`);
	for (const [group, ids] of Object.entries(actual)) {
		assertInventory(`${name}/${group}`, ids, expected[group]);
	}
	if (name === 'canonicalization-vectors') {
		for (const c of value.cases) assertCanonicalAgreement(c);
		const ids = value.cases.filter((c: any) => !c.agrees).map((c: any) => c.id);
		assertInventory(
			'canonicalization/disagreements',
			value.disagreements.map((c: any) => c.id),
			{
				count: ids.length,
				ids: ids.sort(),
			}
		);
		for (const corpus of Object.keys(actual).filter((key) => key !== 'cases')) {
			if (value.corpus[corpus]?.vectorCount !== expected[corpus].count)
				throw new Error(`Corpus count metadata drift: ${corpus}`);
		}
	}
	return value;
}
export const parser = loadVectors('atom-parser-contract-fixtures');
export const anchors = loadVectors('anchor-vectors');
export const ladders = loadVectors('ladder-vectors');
export const canonicalization = loadVectors('canonicalization-vectors');
export const golden = loadVectors('golden-fixture');
export const parserCorpusInventory = loadVectors('parser-corpus-inventory');

export function typedWd(value: unknown): boolean {
	if (typeof value === 'string') return /int:wd:[a-z][a-z0-9-]*:/i.test(value);
	if (Array.isArray(value)) return value.some(typedWd);
	if (value && typeof value === 'object') return Object.values(value).some(typedWd);
	return false;
}
export const anchorCases = anchors.cases.filter(
	(c: any) => !typedWd(c.input) && !typedWd(c.expected.iid)
);
export const ladderCases = ladders.cases.filter(
	(c: any) => !typedWd(c.input) && !typedWd(c.expected.iid)
);
export const excluded = {
	parser: parserCorpusInventory.cases
		.filter((c: any) => c.name.startsWith('iid_typed_wd_'))
		.map((c: any) => c.name),
	anchors: anchors.cases.filter((c: any) => !anchorCases.includes(c)).map((c: any) => c.label),
	ladders: ladders.cases
		.filter((c: any) => !ladderCases.includes(c))
		.map((c: any) => `${c.slug}: ${c.label}`),
};
export function normal(value: any): any {
	if (typeof value === 'bigint') return value.toString();
	if (Array.isArray(value)) return value.map(normal);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((k) => [k, normal(value[k])])
		);
	}
	return value;
}
export function equal(a: any, b: any) {
	return isDeepStrictEqual(normal(a), normal(b));
}

export function assertDefined(value: unknown, path = 'result'): void {
	if (value === undefined) throw new Error(`Unexpected undefined: ${path}`);
	if (value && typeof value === 'object') {
		for (const [key, child] of Object.entries(value)) assertDefined(child, `${path}.${key}`);
	}
}

function text(value: unknown, field: string, nullable = false) {
	if (typeof value !== 'string' && !(nullable && value === null))
		throw new Error(`Malformed recorded output: ${field}`);
	return value;
}

export function recordedCanonicalOutput(c: any) {
	const r = c.referenceOutput;
	switch (c.corpusFile) {
		case 'canonicalization.json':
			return { canonical: text(r.canonical, 'canonical', true) };
		case 'parse.json': {
			const scheme = text(r.scheme, 'scheme', true);
			const value = text(r.value, 'value', true);
			if ((scheme === null) !== (value === null))
				throw new Error('Malformed recorded parse result');
			return { scheme, value };
		}
		case 'norm1.json':
			return { output: text(r.output, 'output') };
		case 'gen1.json':
			return {
				preimage: text(r.preimageReconstructed, 'preimageReconstructed'),
				iid: text(r.iid, 'iid'),
			};
		default:
			throw new Error(`Unknown corpus ${c.corpusFile}`);
	}
}

export function assertCanonicalAgreement(c: any) {
	if (
		typeof c.agrees !== 'boolean' ||
		equal(recordedCanonicalOutput(c), c.corpusExpected) !== c.agrees
	)
		throw new Error(`Agreement metadata drift: ${c.id}`);
}
export function utf8Hex(value: string) {
	return `0x${Buffer.from(value, 'utf8').toString('hex')}`;
}

export function fingerprint(value: unknown) {
	assertDefined(value);
	return createHash('sha256')
		.update(JSON.stringify(normal(value)))
		.digest('hex');
}
