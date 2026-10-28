import { expect, test } from 'bun:test';
import { extractClassificationFields } from '../../../extraction/extract';
import {
	createMockAtomInput,
	createMockPluginContext,
	createMockRequest,
} from '../../../testing/mocks';
import type { EnrichmentArtifact } from '../../../types';
import { createPinAwareFetch } from '../__shared__/http';
import { createWikidataPlugin } from '../wikidata';
import business from '../wikidata/__fixtures__/entity.json';
import organization from '../wikidata/__fixtures__/organization-entity.json';
import fixtures from './__fixtures__/title-type-gate.json';
import { createWikipediaPlugin } from './index';

const inputUrl = 'https://open.spotify.com/album/test';
function request(type: string, name = 'Suspiria', url = inputUrl) {
	return createMockRequest({
		input: createMockAtomInput({
			jsonLd: { '@context': 'https://schema.org', '@type': type, name, url },
			hints: { name, url },
		}),
	});
}
function recordedFetch(summary: Record<string, unknown> = fixtures.summaries.Suspiria) {
	const calls: string[] = [];
	return {
		calls,
		fetch: createPinAwareFetch(async (url: string) => {
			calls.push(url);
			if (url.includes('/page/summary/')) return Response.json(summary);
			if (url.includes('wbsearchentities')) return Response.json({ search: fixtures.search });
			const id = url.match(/(Q[0-9]+)\.json/)?.[1];
			if (!id || !(id in fixtures.entities)) throw new Error(`Unrecorded request: ${url}`);
			return Response.json({
				entities: { [id]: fixtures.entities[id as keyof typeof fixtures.entities] },
			});
		}),
	};
}
test.each([
	'Koyaanisqatsi',
	'Suspiria',
] as const)('album title %s rejects the film summary entirely', async (name) => {
	const transport = recordedFetch(fixtures.summaries[name]);
	expect(
		await createWikipediaPlugin(transport).enrich(
			request('MusicAlbum', name),
			createMockPluginContext()
		)
	).toEqual([]);
	expect(transport.calls).toHaveLength(2);
});
test('Movie title agrees and retains its page identity', async () => {
	const artifacts = await createWikipediaPlugin(recordedFetch()).enrich(
		request('Movie'),
		createMockPluginContext()
	);
	expect(artifacts[0]?.data.pageUrl).toBe(fixtures.summaries.Suspiria.content_urls.desktop.page);
	expect(artifacts[0]?.meta).not.toHaveProperty('identityStrength');
});
test('Wikipedia URL-derived title bypasses type checking', async () => {
	const transport = recordedFetch();
	const artifacts = await createWikipediaPlugin(transport).enrich(
		request('MusicAlbum', 'Suspiria', fixtures.summaries.Suspiria.content_urls.desktop.page),
		createMockPluginContext()
	);
	expect(artifacts).toHaveLength(1);
	expect(transport.calls).toHaveLength(1);
});
test.each([
	undefined,
	'Q999999999',
])('unknown Wikipedia type %s retains text but excludes identity', async (qid) => {
	const summary = { ...fixtures.summaries.Suspiria, wikibase_item: qid };
	const transport = recordedFetch(summary);
	const fetch = async (url: string) =>
		url.includes('Q999999999.json')
			? Response.json({ entities: { Q999999999: { id: 'Q999999999', claims: {} } } })
			: transport.fetch(url);
	const artifacts = await createWikipediaPlugin({ fetch: createPinAwareFetch(fetch) }).enrich(
		request('MusicAlbum'),
		createMockPluginContext()
	);
	expect(artifacts[0]?.meta).toHaveProperty('identityStrength', 'title');
	expect(artifacts[0]?.data.extract).toBe(fixtures.summaries.Suspiria.extract);
	const result = await extractClassificationFields({
		classification: 'music-album',
		url: inputUrl,
		artifacts,
		fetcher: createPinAwareFetch(fetch),
	});
	expect(result.values.sameAs).toEqual([inputUrl]);
	expect(result.fields.name?.evidenceUrl).toBe(
		fixtures.summaries.Suspiria.content_urls.desktop.page
	);
});
test('title-only Wikidata and Wikipedia URLs cannot enter either extraction sameAs path', async () => {
	const artifacts = [
		{
			artifact_type: 'wikidata',
			data: { entityId: fixtures.summaries.Suspiria.wikibase_item, label: 'Suspiria', claims: {} },
			meta: {
				pluginId: 'wikidata',
				provider: 'wikidata',
				fetchedAt: '2026-01-01T00:00:00.000Z',
				identityStrength: 'title',
			},
		},
		{
			artifact_type: 'wikipedia',
			data: {
				title: 'Suspiria',
				extract: 'Film',
				pageUrl: fixtures.summaries.Suspiria.content_urls.desktop.page,
				language: 'en',
			},
			meta: {
				pluginId: 'wikipedia',
				provider: 'wikipedia',
				fetchedAt: '2026-01-01T00:00:00.000Z',
				identityStrength: 'title',
			},
		},
	] as EnrichmentArtifact[];
	for (const classification of ['music-album', 'person']) {
		const result = await extractClassificationFields({
			classification,
			url: inputUrl,
			artifacts,
			fetcher: createPinAwareFetch(async () => {
				throw new Error('No HTTP expected');
			}),
		});
		expect(result.values.sameAs).toEqual([inputUrl]);
	}
});
test('Wikidata title search chooses the second agreeing album with one entity fetch per candidate', async () => {
	const transport = recordedFetch();
	const artifacts = await createWikidataPlugin(transport).enrich(
		request('MusicAlbum'),
		createMockPluginContext()
	);
	expect(artifacts[0]?.data.entityId).toBe('Q3978305');
	expect(transport.calls[0]).toContain('limit=5');
	expect(transport.calls).toHaveLength(3);
});
test('Wikidata title search with no agreeing candidate returns no artifact', async () => {
	expect(
		await createWikidataPlugin(recordedFetch()).enrich(request('Book'), createMockPluginContext())
	).toEqual([]);
});
test('Wikidata explicit entity URL retains existing behavior', async () => {
	const transport = recordedFetch();
	const artifacts = await createWikidataPlugin(transport).enrich(
		request(
			'MusicAlbum',
			'Suspiria',
			`https://www.wikidata.org/wiki/${fixtures.summaries.Suspiria.wikibase_item}`
		),
		createMockPluginContext()
	);
	expect(artifacts[0]?.data.entityId).toBe(fixtures.summaries.Suspiria.wikibase_item);
	expect(transport.calls).toHaveLength(1);
});

test('sameAs uses the agreeing artifact claims when a title-only artifact precedes it', async () => {
	const meta = {
		pluginId: 'wikidata',
		provider: 'wikidata',
		fetchedAt: '2026-01-01T00:00:00.000Z',
	};
	const result = await extractClassificationFields({
		classification: 'person',
		url: inputUrl,
		artifacts: [
			{
				artifact_type: 'wikidata',
				data: {
					entityId: fixtures.summaries.Suspiria.wikibase_item,
					label: 'Suspiria',
					claims: {},
				},
				meta: { ...meta, identityStrength: 'title' },
			},
			{
				artifact_type: 'wikidata',
				data: { entityId: 'Q3978305', label: 'Suspiria', claims: {} },
				meta,
			},
		],
		fetcher: createPinAwareFetch(async () => {
			throw new Error('No HTTP expected');
		}),
	});
	expect(result.values.sameAs).toEqual([inputUrl, 'https://www.wikidata.org/wiki/Q3978305']);
});

function candidateFetch(ids: string[], entities: Record<string, unknown>) {
	return {
		fetch: createPinAwareFetch(async (url: string) => {
			if (url.includes('wbsearchentities'))
				return Response.json({ search: ids.map((id) => ({ id })) });
			const id = url.match(/(Q[0-9]+)\.json/)?.[1];
			if (!id || !entities[id]) throw new Error(`Unrecorded request: ${url}`);
			return Response.json({ entities: { [id]: entities[id] } });
		}),
	};
}
test.each([
	'Thing',
	undefined,
])('generic Wikipedia request %s keeps text without identity', async (type) => {
	const generic = request('Thing');
	if (type === undefined) delete generic.input.jsonLd['@type'];
	const artifacts = await createWikipediaPlugin(recordedFetch()).enrich(
		generic,
		createMockPluginContext()
	);
	expect(artifacts[0]?.meta.identityStrength).toBe('title');
	const result = await extractClassificationFields({
		classification: 'thing',
		url: inputUrl,
		artifacts,
		fetcher: createPinAwareFetch(recordedFetch().fetch),
	});
	expect(result.values.sameAs).toEqual([inputUrl]);
});
test.each([
	'Organization',
	'Thing',
	undefined,
])('unknown Wikidata business for %s retains text without URL or templated IDs', async (type) => {
	const generic = request(type ?? 'Thing');
	if (type === undefined) delete generic.input.jsonLd['@type'];
	const entity = {
		...business.entities.Q12345,
		claims: {
			...business.entities.Q12345.claims,
			P2002: [
				{
					mainsnak: { snaktype: 'value', datavalue: { type: 'string', value: 'acme_fixture' } },
				},
			],
		},
	};
	const artifacts = await createWikidataPlugin(
		candidateFetch(['Q12345'], { Q12345: entity })
	).enrich(generic, createMockPluginContext());
	expect(artifacts).toHaveLength(1);
	expect(artifacts[0]?.meta.identityStrength).toBe('title');
	expect(artifacts[0]?.data.label).toBe('Acme Labs');
	expect(artifacts[0]?.data.aliases).toEqual(['Acme']);
	for (const classification of ['thing', 'person']) {
		const result = await extractClassificationFields({
			classification,
			url: inputUrl,
			artifacts,
			fetcher: createPinAwareFetch(async () => {
				throw new Error('No HTTP expected');
			}),
		});
		expect(result.values.sameAs).toEqual([inputUrl]);
	}
	const unflagged = artifacts.map((artifact) => ({
		...artifact,
		meta: { ...artifact.meta, identityStrength: undefined },
	}));
	const identity = await extractClassificationFields({
		classification: 'person',
		url: inputUrl,
		artifacts: unflagged,
		fetcher: createPinAwareFetch(async () => {
			throw new Error('No HTTP expected');
		}),
	});
	expect(identity.values.sameAs).toContain('https://x.com/acme_fixture');
	expect(identity.values.sameAs).toContain('https://www.wikidata.org/wiki/Q12345');
});
test('Wikidata organization agrees with MusicGroup', async () => {
	const artifacts = await createWikidataPlugin(
		candidateFetch(['Q12345'], organization.entities)
	).enrich(request('MusicGroup'), createMockPluginContext());
	expect(artifacts).toHaveLength(1);
	expect(artifacts[0]?.meta.identityStrength).toBeUndefined();
});
test('Wikidata agreement beats an earlier unknown and mismatches emit nothing', async () => {
	const entities = { ...fixtures.entities, ...business.entities };
	const artifacts = await createWikidataPlugin(
		candidateFetch(['Q546900', 'Q12345', 'Q3978305'], entities)
	).enrich(request('MusicAlbum'), createMockPluginContext());
	expect(artifacts[0]?.data.entityId).toBe('Q3978305');
	expect(artifacts[0]?.meta.identityStrength).toBeUndefined();
	expect(
		await createWikidataPlugin(candidateFetch(['Q546900'], entities)).enrich(
			request('MusicAlbum'),
			createMockPluginContext()
		)
	).toEqual([]);
});
test('generic Wikidata request flags the first known candidate', async () => {
	const artifacts = await createWikidataPlugin(recordedFetch()).enrich(
		request('Thing'),
		createMockPluginContext()
	);
	expect(artifacts[0]?.data.entityId).toBe('Q546900');
	expect(artifacts[0]?.meta.identityStrength).toBe('title');
});

function failingCandidateFetch(ids: string[], failure: 'http' | 'schema' | 'timeout' = 'http') {
	const recorded = candidateFetch(ids, { ...fixtures.entities, ...business.entities });
	return {
		fetch: createPinAwareFetch(async (url: string) => {
			if (!url.includes('Q99999.json')) return recorded.fetch(url);
			if (failure === 'schema') return Response.json({ entities: [] });
			if (failure === 'timeout') throw new DOMException('Candidate timed out', 'TimeoutError');
			return new Response('Unavailable', { status: 503 });
		}),
	};
}
test.each([
	'http',
	'schema',
	'timeout',
] as const)('Wikidata retains unknown after later candidate %s failure', async (failure) => {
	const artifacts = await createWikidataPlugin(
		failingCandidateFetch(['Q12345', 'Q99999'], failure)
	).enrich(request('Organization'), createMockPluginContext());
	expect(artifacts).toHaveLength(1);
	expect(artifacts[0]?.data.label).toBe('Acme Labs');
	expect(artifacts[0]?.meta.identityStrength).toBe('title');
});
test('Wikidata agreement survives earlier candidate failure', async () => {
	const artifacts = await createWikidataPlugin(
		failingCandidateFetch(['Q99999', 'Q3978305'])
	).enrich(request('MusicAlbum'), createMockPluginContext());
	expect(artifacts[0]?.data.entityId).toBe('Q3978305');
	expect(artifacts[0]?.meta.identityStrength).toBeUndefined();
});
test('Wikidata all candidate failures still surface upstream error', async () => {
	await expect(
		createWikidataPlugin(failingCandidateFetch(['Q99999', 'Q99999'])).enrich(
			request('Organization'),
			createMockPluginContext()
		)
	).rejects.toThrow('HTTP 503');
});
test('Wikidata cancellation after unknown propagates without an artifact', async () => {
	const controller = new AbortController();
	const recorded = failingCandidateFetch(['Q12345', 'Q99999']);
	const abort = new DOMException('Cancelled', 'AbortError');
	const plugin = createWikidataPlugin({
		fetch: createPinAwareFetch(async (url) => {
			if (url.includes('Q99999.json')) {
				controller.abort(abort);
				throw abort;
			}
			return recorded.fetch(url);
		}),
	});
	await expect(
		plugin.enrich(request('Organization'), createMockPluginContext({ signal: controller.signal }))
	).rejects.toThrow('Cancelled');
});
test('Wikidata already aborted signal cannot emit an artifact even with a fixture transport', async () => {
	const controller = new AbortController();
	controller.abort(new DOMException('Cancelled', 'AbortError'));
	await expect(
		createWikidataPlugin(candidateFetch(['Q12345'], business.entities)).enrich(
			request('Organization'),
			createMockPluginContext({ signal: controller.signal })
		)
	).rejects.toThrow('Cancelled');
});
