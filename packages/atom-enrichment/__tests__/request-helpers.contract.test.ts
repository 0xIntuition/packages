import { describe, expect, it } from 'bun:test';
import { getIdentifier, getRequestName } from '../src/plugins/providers/__shared__/request';
import type { EnrichmentRequest } from '../src/types';
import { classifiedAtomInputSchema } from '../src/types';

const BASE_REQUEST: Omit<EnrichmentRequest, 'input'> = {
	runtime: 'server',
};

function createRequest(inputOverrides: EnrichmentRequest['input']): EnrichmentRequest {
	return {
		...BASE_REQUEST,
		input: inputOverrides,
	};
}

describe('request helper name resolution', () => {
	it('ignores URL-like names from hints and JSON-LD', () => {
		const request = createRequest({
			atomType: 'thing',
			jsonLd: {
				name: 'https://github.com/vercel/next.js',
			},
			source: {
				classificationEngine: '@0xintuition/atom-classification',
				classifiedAt: '2026-02-11T00:00:00.000Z',
			},
			hints: {
				name: 'https://en.wiktionary.org/wiki/https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js',
			},
		});

		expect(getRequestName(request)).toBeUndefined();
	});

	it('falls back to a non-URL JSON-LD name when hint name is URL-like', () => {
		const request = createRequest({
			atomType: 'software',
			jsonLd: {
				name: 'next.js',
				url: 'https://github.com/vercel/next.js',
			},
			source: {
				classificationEngine: '@0xintuition/atom-classification',
				classifiedAt: '2026-02-11T00:00:00.000Z',
			},
			hints: {
				name: 'https://github.com/vercel/next.js',
				url: 'https://github.com/vercel/next.js',
			},
		});

		expect(getRequestName(request)).toBe('next.js');
	});
});

describe('request helper identifier resolution', () => {
	it('resolves a first-class IID without URL or caller-populated hints', () => {
		const input = classifiedAtomInputSchema.parse({
			atomType: 'song',
			identifier: {
				iid: 'int:isrc:USUM71703861',
				scheme: 'isrc',
				value: 'USUM71703861',
			},
			source: {
				classificationEngine: 'iid-fixture',
				classifiedAt: '2026-08-07T12:00:00.000Z',
			},
		});
		const request = createRequest(input);

		expect(getIdentifier(request, 'isrc')).toBe('USUM71703861');
	});
});
