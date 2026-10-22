import { describe, expect, it } from 'vitest';
import {
	inspectIntuitionId,
	isAnchorEligible,
	parseIntuitionId,
	validateIntuitionId,
} from '../parse.js';
import { getScheme } from '../schemes.js';

const cases = [
	['podcast-index', '3421639', ['0', '0123', ' 123', '123 ', 'ABC', '1\n']],
	['apple-podcasts', '1222114325', ['0', '0123', ' 123', '123 ', 'ABC', '1\n']],
	[
		'letterboxd',
		'film:moonlight',
		[
			'film:Moonlight',
			'film:-moonlight',
			'film:moon--light',
			'film:moonlight-',
			' film:moonlight',
			'film:moonlight\n',
		],
	],
] as const;

describe('registered provider-local identifiers', () => {
	for (const [name, value, invalid] of cases) {
		it(`${name}: parses, canonicalizes and inspects a typed P1 identifier`, () => {
			const iid = `int:${name}:${value}`;
			expect(getScheme(name)?.canonicalize(value)).toBe(value);
			expect(parseIntuitionId(iid)).toEqual({ scheme: name, value });
			expect(validateIntuitionId(iid)).toBe(true);
			expect(inspectIntuitionId(iid)).toEqual({
				valid: true,
				iid,
				scheme: name,
				value,
				class: 'D',
				typing: 'unambiguous',
				anchorEligible: false,
				anchorIneligibilityReason: 'provider-local',
			});
			expect(isAnchorEligible(iid)).toBe(false);
		});
		it.each(invalid)(`${name}: rejects %j without repair`, (raw) => {
			expect(getScheme(name)).toBeDefined();
			expect(getScheme(name)?.canonicalize(raw)).toBeUndefined();
			expect(validateIntuitionId(`int:${name}:${raw}`)).toBe(false);
			const inspection = inspectIntuitionId(`int:${name}:${raw}`);
			expect(inspection.valid).toBe(false);
			expect(inspection).not.toHaveProperty('canonical');
		});
	}
});
