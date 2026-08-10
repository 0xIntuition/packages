/**
 * Executes the full normative conformance corpus from
 * `@0xintuition/iid-spec` against this implementation. Every vector is a
 * frozen contract; a failure here is either an implementation defect or an
 * identity-impacting change that must go through spec governance.
 */
import canonicalization from '@0xintuition/iid-spec/conformance/canonicalization.json';
import gen1 from '@0xintuition/iid-spec/conformance/gen1.json';
import norm1Vectors from '@0xintuition/iid-spec/conformance/norm1.json';
import parseVectors from '@0xintuition/iid-spec/conformance/parse.json';
import schemesSnapshot from '@0xintuition/iid-spec/conformance/schemes.json';
import validation from '@0xintuition/iid-spec/conformance/validation.json';
import { describe, expect, it } from 'vitest';

import { buildGen1Iid } from '../gen1.js';
import { norm1 } from '../norm.js';
import { isAnchorEligible, parseIntuitionId, validateIntuitionId } from '../parse.js';
import { SCHEME_TYPING, SCHEMES } from '../schemes.js';
import type { SchemeName } from '../types.js';

describe('conformance: canonicalization', () => {
	for (const vector of canonicalization.vectors) {
		it(`${vector.id} — ${vector.note}`, () => {
			const scheme = SCHEMES[vector.scheme as SchemeName];
			expect(scheme).toBeDefined();
			const actual = scheme.canonicalize(vector.raw);

			if (vector.canonical === null) {
				expect(actual).toBeUndefined();
			} else {
				expect(actual).toBe(vector.canonical);
				// Idempotence is a conformance requirement (spec §1.3.2).
				expect(scheme.canonicalize(vector.canonical)).toBe(vector.canonical);
				expect(scheme.isCanonical(vector.canonical)).toBe(true);
			}
		});
	}
});

describe('conformance: NORM-1', () => {
	for (const vector of norm1Vectors.vectors) {
		it(`${vector.id} — ${vector.note}`, () => {
			expect(norm1(vector.input)).toBe(vector.output);
		});
	}
});

describe('conformance: gen1', () => {
	for (const vector of gen1.vectors) {
		it(`${vector.id} — ${vector.note}`, () => {
			expect(buildGen1Iid(vector.slug, vector.tag, vector.fields)).toBe(vector.iid);
		});
	}
});

describe('conformance: parse', () => {
	for (const vector of parseVectors.vectors) {
		it(`${vector.id} — ${vector.note}`, () => {
			const actual = parseIntuitionId(vector.input);

			if (vector.scheme === null) {
				expect(actual).toBeUndefined();
			} else {
				expect(actual).toEqual({ scheme: vector.scheme, value: vector.value });
			}
		});
	}
});

describe('conformance: validation and anchor eligibility', () => {
	for (const vector of validation.vectors) {
		it(`${vector.id} — ${vector.note}`, () => {
			expect(validateIntuitionId(vector.iid)).toBe(vector.valid);
			expect(isAnchorEligible(vector.iid)).toBe(vector.anchorEligible);
		});
	}
});

describe('conformance: scheme registry snapshot', () => {
	it('classes and typing match the ratified registry', () => {
		const snapshot = schemesSnapshot.schemes as Record<string, { class: string; typing: string }>;
		expect(Object.keys(snapshot).sort()).toEqual(Object.keys(SCHEMES).sort());

		for (const [name, entry] of Object.entries(snapshot)) {
			expect(SCHEMES[name as SchemeName].class).toBe(entry.class);
			expect(SCHEME_TYPING[name as SchemeName]).toBe(entry.typing);
		}
	});
});
