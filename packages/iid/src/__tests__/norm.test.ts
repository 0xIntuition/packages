import { describe, expect, it } from 'vitest';

import { norm1 } from '../norm.js';

describe('norm1', () => {
	it('lowercases and collapses whitespace', () => {
		expect(norm1('  Daft   Punk  ')).toBe('daft punk');
		expect(norm1('KISS')).toBe('kiss');
	});

	it('applies NFKC compatibility folding', () => {
		expect(norm1('ＡＢＢＡ')).toBe('abba');
		expect(norm1('ﬁre')).toBe('fire');
	});

	it('folds punctuation variants that NFKC leaves alone (D16)', () => {
		expect(norm1('Don’t Stop Me Now')).toBe(norm1("Don't Stop Me Now"));
		expect(norm1('“Heroes”')).toBe(norm1('"Heroes"'));
		expect(norm1('2010–2014')).toBe(norm1('2010-2014'));
	});

	it('uses full case folding, not toLowerCase (D16)', () => {
		expect(norm1('Straße')).toBe(norm1('STRASSE'));
		expect(norm1('ΟΔΥΣΣΕΥΣ')).toBe(norm1('οδυσσευς'));
	});

	it('never strips diacritics (D14)', () => {
		expect(norm1('Beyoncé')).not.toBe(norm1('Beyonce'));
		expect(norm1('Björk')).not.toBe(norm1('Bjork'));
	});
});
