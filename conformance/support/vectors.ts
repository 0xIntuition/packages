import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const referenceSha = '31b62f35a787b6a7b9318f7a5d245ba6d0c76e9b';
export function loadVectors(name: string) {
	const value = JSON.parse(
		readFileSync(new URL(`../vectors/${name}.json`, import.meta.url), 'utf8')
	);
	if (value.provenance.referenceSha !== referenceSha) throw new Error(`Provenance drift: ${name}`);
	return value;
}
export const parser = loadVectors('atom-parser-contract-fixtures');
export const anchors = loadVectors('anchor-vectors');
export const ladders = loadVectors('ladder-vectors');
export const canonicalization = loadVectors('canonicalization-vectors');
export const golden = loadVectors('golden-fixture');

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
	anchors: anchors.cases.filter((c: any) => !anchorCases.includes(c)).map((c: any) => c.label),
	ladders: ladders.cases
		.filter((c: any) => !ladderCases.includes(c))
		.map((c: any) => `${c.slug}: ${c.label}`),
};
export function normal(value: any): any {
	if (value === undefined) return null;
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
	return JSON.stringify(normal(a)) === JSON.stringify(normal(b));
}
export function utf8Hex(value: string) {
	return `0x${Buffer.from(value, 'utf8').toString('hex')}`;
}

export function fingerprint(value: unknown) {
	return createHash('sha256')
		.update(JSON.stringify(normal(value)))
		.digest('hex');
}
