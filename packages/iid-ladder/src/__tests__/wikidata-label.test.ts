import { describe, expect, it } from 'vitest';
import { pickWikidataLabel } from '../index.js';

describe('Wikidata locale policy', () => {
	it('uses mul ahead of arbitrary languages', () => {
		expect(pickWikidataLabel({ dv: { value: 'ޓޯއި ސްޓޯރީ' }, mul: { value: 'Toy Story' } })).toBe(
			'Toy Story'
		);
	});
	it('returns nothing for Japanese-only or absent values', () => {
		expect(pickWikidataLabel({ ja: { value: 'Japanese title' } })).toBeUndefined();
		expect(pickWikidataLabel(undefined)).toBeUndefined();
	});
	it('orders requested language, English, regional English and mul', () => {
		const labels = {
			fr: { value: 'French' },
			en: { value: 'English' },
			'en-gb': { value: 'British' },
			'en-us': { value: 'American' },
			'en-ca': { value: 'Canadian' },
			'en-au': { value: 'Australian' },
			mul: { value: 'Multilingual' },
		};
		expect(pickWikidataLabel(labels, 'fr')).toBe('French');
		expect(pickWikidataLabel(labels)).toBe('English');
		expect(pickWikidataLabel({ ...labels, en: { value: '  ' } })).toBe('British');
		expect(
			pickWikidataLabel({
				'en-us': labels['en-us'],
				'en-ca': labels['en-ca'],
				'en-au': labels['en-au'],
				mul: labels.mul,
			})
		).toBe('American');
		expect(
			pickWikidataLabel({ 'en-ca': labels['en-ca'], 'en-au': labels['en-au'], mul: labels.mul })
		).toBe('Canadian');
		expect(pickWikidataLabel({ 'en-au': labels['en-au'], mul: labels.mul })).toBe('Australian');
	});
	it('trims values and skips malformed or blank entries', () => {
		expect(pickWikidataLabel({ en: { value: ' ' }, mul: { value: ' Toy Story ' } })).toBe(
			'Toy Story'
		);
		expect(
			pickWikidataLabel({ en: null, 'en-gb': { value: 42 }, mul: { value: 'Toy Story' } })
		).toBe('Toy Story');
	});
});
