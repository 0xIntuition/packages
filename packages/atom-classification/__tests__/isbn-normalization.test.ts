import { describe, expect, it } from 'bun:test';
import { normalizeIsbn } from '../src/plugins/shared/isbn';

describe('shared ISBN normalization', () => {
	it('strips hyphens and spaces from a valid ISBN-13', () => {
		expect(normalizeIsbn('978-1-4555 8669-1')).toBe('9781455586691');
	});

	it('rejects an invalid check digit', () => {
		expect(normalizeIsbn('978-1-45558-669-2')).toBeUndefined();
	});

	it('converts an ISBN-10 with an X check digit to ISBN-13', () => {
		expect(normalizeIsbn('1-55860-832-X')).toBe('9781558608320');
	});

	it.each([
		' ISBN: 9781455586691 ',
		'ISBN-13: 978-1-4555-8669-1',
		'isbn 1455586692',
	])('strips one anchored ISBN prefix from %s', (input) => {
		expect(normalizeIsbn(input)).toBe('9781455586691');
	});

	it.each([
		'ISBNX',
		'ISBN: garbage',
		'XISBN:9781455586691',
		'see ISBN 9781455586691',
		'ISBN:ISBN:9781455586691',
	])('rejects invalid or unanchored prefixed input %s', (input) => {
		expect(normalizeIsbn(input)).toBeUndefined();
	});
});
