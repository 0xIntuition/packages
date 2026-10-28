import { describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { projectIdentifierLadder } from '@0xintuition/iid-ladder';
import { createClassificationEngine, createTypeProfilesPlugin, createWikidataPlugin } from '../src';

const SEEDED_IIDS = [
	['Q751921', 'Q11424', 'int:wd:film:Q751921'],
	['Q1146711', 'Q11424', 'int:wd:film:Q1146711'],
	['Q900000001', 'Q506240', 'int:wd:film:Q900000001'],
	['Q137400033', 'Q5398426', 'int:wd:television-series:Q137400033'],
] as const;

useStubbedPublicDns();

describe('wikidata classification plugin', () => {
	for (const [qid, p31, seededIid] of SEEDED_IIDS) {
		it(`emits seeded IID parity for ${qid}`, async () => {
			const engine = createClassificationEngine({
				onClassifierError: () => undefined,
				plugins: [
					createTypeProfilesPlugin(),
					createWikidataPlugin({
						fetch: createPinAwareFetch(
							async () =>
								new Response(
									JSON.stringify({
										entities: {
											[qid]: {
												claims: {
													P31: [{ mainsnak: { datavalue: { value: { id: p31 } } } }],
												},
												labels: { en: { value: `Entity ${qid}` } },
											},
										},
									}),
									{ status: 200 }
								)
						),
					}),
				],
				runtime: 'server',
			});

			const result = await engine.classify({
				classificationSessionId: `wikidata-${qid}`,
				input: `https://www.wikidata.org/wiki/${qid}`,
				mode: 'server-only',
			});
			const atom = result.resolved?.atoms[0];

			expect(atom?.title).toBe(`Entity ${qid}`);
			expect(projectIdentifierLadder({ providerCanonicalId: atom?.canonicalId })).toEqual({
				iid: seededIid,
				rung: 'handle',
			});
		});
	}

	it('accepts EntityData URLs and falls back to bare wd for an unknown P31', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createWikidataPlugin({
					fetch: createPinAwareFetch(
						async () =>
							new Response(
								JSON.stringify({
									entities: {
										Q42: {
											claims: {
												P31: [{ mainsnak: { datavalue: { value: { id: 'Q999999' } } } }],
											},
											labels: { en: { value: 'Douglas Adams' } },
										},
									},
								}),
								{ status: 200 }
							)
					),
				}),
			],
			runtime: 'server',
		});

		const result = await engine.classify({
			classificationSessionId: 'wikidata-entity-data',
			input: 'https://www.wikidata.org/wiki/Special:EntityData/Q42.json',
			mode: 'server-only',
		});

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'wd:Q42',
			schemaType: 'Thing',
			title: 'Douglas Adams',
		});
	});

	it('selects labels and descriptions by the shared locale policy, never a random language (ENG-16199)', async () => {
		const classify = async (labels: unknown, descriptions: unknown) => {
			const engine = createClassificationEngine({
				onClassifierError: () => undefined,
				plugins: [
					createTypeProfilesPlugin(),
					createWikidataPlugin({
						fetch: createPinAwareFetch(
							async () =>
								new Response(
									JSON.stringify({
										entities: {
											Q171048: {
												claims: {
													P31: [{ mainsnak: { datavalue: { value: { id: 'Q999999' } } } }],
												},
												labels,
												descriptions,
											},
										},
									}),
									{ status: 200 }
								)
						),
					}),
				],
				runtime: 'server',
			});
			const result = await engine.classify({
				classificationSessionId: 'wikidata-label-locale',
				input: 'https://www.wikidata.org/wiki/Q171048',
				mode: 'server-only',
			});
			return result.resolved?.atoms[0];
		};

		// Q171048 shape: `dv` is the first key, `mul` carries the English title, no `en`.
		const mulOnly = await classify(
			{ dv: { value: 'ޓޯއި ސްޓޯރީ' }, mul: { value: 'Toy Story' } },
			{ dv: { value: 'ފިލްމު' }, mul: { value: '1995 film' } }
		);
		expect(mulOnly).toMatchObject({ title: 'Toy Story', description: '1995 film' });

		const regional = await classify({ 'en-gb': { value: 'Toy Story (GB)' } }, undefined);
		expect(regional).toMatchObject({ title: 'Toy Story (GB)' });
		expect(regional?.description).toBeUndefined();

		// No policy language at all: the synthesized placeholder, never the `ja` label.
		const japaneseOnly = await classify({ ja: { value: 'トイ・ストーリー' } }, undefined);
		expect(japaneseOnly).toMatchObject({ title: 'Wikidata Q171048' });
	});

	it('threads the resolver abort signal into EntityData fetch and body work', async () => {
		let observedSignal: AbortSignal | undefined;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createWikidataPlugin({
					fetch: createPinAwareFetch(async (_input, init) => {
						observedSignal = init?.signal ?? undefined;
						return await new Promise<Response>((resolve) => {
							init?.signal?.addEventListener(
								'abort',
								() => resolve(new Response('', { status: 499 })),
								{ once: true }
							);
						});
					}),
				}),
			],
			resolverTimeoutMs: 5,
			runtime: 'server',
		});

		await engine.classify({
			classificationSessionId: 'wikidata-abort',
			input: 'https://www.wikidata.org/wiki/Q42',
			mode: 'server-only',
		});

		expect(observedSignal).toBeDefined();
		expect(observedSignal?.aborted).toBe(true);
	});

	it('caps and deduplicates English aliases', async () => {
		const aliases = Array.from({ length: 30 }, (_, index) => ({
			value: `Alias ${index % 25}`,
		}));
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createWikidataPlugin({
					fetch: createPinAwareFetch(
						async () =>
							new Response(
								JSON.stringify({
									entities: {
										Q42: {
											aliases: { en: aliases },
											claims: {},
											labels: { en: { value: 'Douglas Adams' } },
										},
									},
								}),
								{ status: 200 }
							)
					),
				}),
			],
			runtime: 'server',
		});

		const result = await engine.classify({
			classificationSessionId: 'wikidata-alias-cap',
			input: 'https://www.wikidata.org/wiki/Q42',
			mode: 'server-only',
		});

		expect(result.resolved?.atoms[0]?.data?.alternateName).toHaveLength(20);
		expect(new Set(result.resolved?.atoms[0]?.data?.alternateName as string[]).size).toBe(20);
	});

	it('degrades an over-budget EntityData response to bare wd with a typed reason', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createWikidataPlugin({
					fetch: createPinAwareFetch(
						async () =>
							new Response(JSON.stringify({ entities: {} }), {
								headers: { 'content-length': '2000000' },
								status: 200,
							})
					),
				}),
			],
			runtime: 'server',
		});

		const result = await engine.classify({
			classificationSessionId: 'wikidata-over-budget',
			input: 'https://www.wikidata.org/wiki/Q42',
			mode: 'server-only',
		});

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'wd:Q42',
			metadata: { identityProjectionReason: 'entitydata_response_too_large' },
			schemaType: 'Thing',
		});
	});
});
