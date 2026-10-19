import { describe, expect, it, vi } from 'vitest';
import {
	createIntuitionApiClient,
	type FetchLike,
	getIntuitionApiUrl,
	INTUITION_API_URL_LOCAL,
	INTUITION_API_URL_MAINNET,
	INTUITION_API_URL_TESTNET,
} from './index';

function createJsonResponse(payload: unknown) {
	return {
		ok: true,
		status: 200,
		async json() {
			return payload;
		},
		async text() {
			return JSON.stringify(payload);
		},
	};
}

describe('createIntuitionApiClient', () => {
	it('maps supported networks to canonical graphql endpoints', () => {
		expect(getIntuitionApiUrl('local')).toBe(INTUITION_API_URL_LOCAL);
		expect(getIntuitionApiUrl('testnet')).toBe(INTUITION_API_URL_TESTNET);
		expect(getIntuitionApiUrl('mainnet')).toBe(INTUITION_API_URL_MAINNET);
	});

	it('queries an atom by id and normalizes the response shape', async () => {
		const fetcher = vi.fn<FetchLike>().mockResolvedValue(
			createJsonResponse({
				data: {
					atom: {
						term_id: '0xabc',
						label: 'Example atom',
						data: 'ipfs://example',
						image: null,
						emoji: 'a',
						type: 'Thing',
					},
				},
			})
		);

		const client = createIntuitionApiClient({
			baseUrl: 'https://api.intuition.systems/v1/graphql',
			fetch: fetcher,
		});

		await expect(client.atoms.getById({ termId: '0xabc' })).resolves.toEqual({
			termId: '0xabc',
			label: 'Example atom',
			data: 'ipfs://example',
			image: null,
			emoji: 'a',
			type: 'Thing',
		});

		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(fetcher.mock.calls[0]?.[0]).toBe('https://api.intuition.systems/v1/graphql');
		expect(fetcher.mock.calls[0]?.[1]?.method).toBe('POST');
	});

	it('queries an atom by label and returns the first result', async () => {
		const fetcher = vi.fn<FetchLike>().mockResolvedValue(
			createJsonResponse({
				data: {
					atoms: [
						{
							term_id: '0xdef',
							label: 'introspection',
							data: 'ipfs://cid',
							image: null,
							emoji: null,
							type: 'Thing',
						},
					],
				},
			})
		);

		const client = createIntuitionApiClient({
			baseUrl: 'https://api.intuition.systems/v1/graphql',
			fetch: fetcher,
			auth: {
				kind: 'bearer',
				token: 'secret-token',
			},
		});

		await expect(client.atoms.getByLabel({ label: 'introspection' })).resolves.toEqual({
			termId: '0xdef',
			label: 'introspection',
			data: 'ipfs://cid',
			image: null,
			emoji: null,
			type: 'Thing',
		});

		expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
			Authorization: 'Bearer secret-token',
			'Content-Type': 'application/json',
		});
	});

	it('queries an atom by data', async () => {
		const fetcher = vi.fn<FetchLike>().mockResolvedValue(
			createJsonResponse({
				data: {
					atoms: [
						{
							term_id: '0x999',
							label: 'uploaded atom',
							data: 'ipfs://bafybeibexample',
							image: null,
							emoji: null,
							type: 'Thing',
						},
					],
				},
			})
		);

		const client = createIntuitionApiClient({
			baseUrl: 'https://api.intuition.systems/v1/graphql',
			fetch: fetcher,
		});

		await expect(client.atoms.getByData({ data: 'ipfs://bafybeibexample' })).resolves.toEqual({
			termId: '0x999',
			label: 'uploaded atom',
			data: 'ipfs://bafybeibexample',
			image: null,
			emoji: null,
			type: 'Thing',
		});
	});

	it('supports api key auth and surfaces graphql errors', async () => {
		const fetcher = vi.fn<FetchLike>().mockResolvedValue(
			createJsonResponse({
				errors: [{ message: 'forbidden' }],
			})
		);

		const client = createIntuitionApiClient({
			baseUrl: 'https://api.intuition.systems/v1/graphql',
			fetch: fetcher,
			auth: {
				kind: 'apiKey',
				value: 'key-123',
				headerName: 'x-intuition-key',
			},
		});

		await expect(client.atoms.getByLabel({ label: 'restricted' })).rejects.toThrow('forbidden');
		expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
			'x-intuition-key': 'key-123',
		});
	});

	it('queries a triple by id and normalizes linked terms', async () => {
		const fetcher = vi.fn<FetchLike>().mockResolvedValue(
			createJsonResponse({
				data: {
					triple: {
						term_id: '0xtriple',
						subject: {
							term_id: '0xsubject',
							label: 'Alice',
							image: null,
							type: 'Thing',
						},
						predicate: {
							term_id: '0xpredicate',
							label: 'follows',
							image: null,
							type: 'Thing',
						},
						object: {
							term_id: '0xobject',
							label: 'Bob',
							image: null,
							type: 'Thing',
						},
					},
				},
			})
		);

		const client = createIntuitionApiClient({
			baseUrl: 'https://api.intuition.systems/v1/graphql',
			fetch: fetcher,
		});

		await expect(client.triples.getById({ termId: '0xtriple' })).resolves.toEqual({
			termId: '0xtriple',
			subject: {
				termId: '0xsubject',
				label: 'Alice',
				image: null,
				type: 'Thing',
			},
			predicate: {
				termId: '0xpredicate',
				label: 'follows',
				image: null,
				type: 'Thing',
			},
			object: {
				termId: '0xobject',
				label: 'Bob',
				image: null,
				type: 'Thing',
			},
		});
	});

	it('defaults to the global fetch implementation and mainnet api url', async () => {
		const fetcher = vi.fn<FetchLike>().mockResolvedValue(
			createJsonResponse({
				data: {
					atom: null,
				},
			})
		);

		const fetchTarget = globalThis as { fetch?: FetchLike };
		const originalFetch = fetchTarget.fetch;
		fetchTarget.fetch = fetcher;

		try {
			const client = createIntuitionApiClient({});
			await expect(client.atoms.getById({ termId: '0xmissing' })).resolves.toBeNull();
			expect(fetcher.mock.calls[0]?.[0]).toBe(INTUITION_API_URL_MAINNET);
		} finally {
			fetchTarget.fetch = originalFetch;
		}
	});
});
