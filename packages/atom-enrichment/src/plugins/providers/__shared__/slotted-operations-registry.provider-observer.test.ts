import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	lookupProviderOperation,
	registeredOperationsForScope,
} from '@0xintuition/pipeline-runtime/provider-registry';
import { resetProcessRequestSlotsForTests } from '@0xintuition/pipeline-runtime/request-slot';
import { createRefusingAfterSlot } from '@0xintuition/pipeline-runtime/testing/held-request-slot';
import {
	createMockAtomInput,
	createMockPluginContext,
	createMockRequest,
	useStubbedPublicDns,
} from '../../../testing';
import { createMusicBrainzPlugin } from '../musicbrainz';
import { createOpenLibraryPlugin } from '../openlibrary';
import { createWikidataPlugin } from '../wikidata';
import { createWikipediaPlugin } from '../wikipedia';
import { createPinAwareFetch } from './http';

/**
 * ENG-17085: every operation that goes through a pacing slot must declare `budget_exhausted`,
 * or a slot refusal would be a series the registry (and the exposition) has never heard of.
 *
 * The slotted set is not a hand list: each plugin runs against a slot that wraps every request
 * (it counts its `run`s) and refuses all but the first `admit`; every provider request event a
 * run emits went through that slot, so the operations the events name ARE the slotted ones.
 */

useStubbedPublicDns();
// mock-module-exempt: the shared provider hop resolves every target through node:dns before it
// dials; nothing is dialled here.
const realDns = await import('node:dns/promises');
mock.module('node:dns/promises', () => ({
	...realDns,
	default: realDns,
	lookup: async () => [{ address: '93.184.216.34', family: 4 }],
}));

let events: ProviderEvent[];
beforeEach(() => {
	events = [];
	resetProcessRequestSlotsForTests();
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => {
	resetProviderObserversForTests();
	resetProcessRequestSlotsForTests();
});

const json = async (dir: string, name: string): Promise<unknown> =>
	await Bun.file(new URL(`../${dir}/__fixtures__/${name}`, import.meta.url)).json();

const MBID = '17eb3129-0f17-403f-bea0-b524d6ffb770';
const source = { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' };
const mbInput = (hints: Record<string, unknown>) =>
	createMockRequest({
		input: {
			atomType: 'thing',
			identifier: { iid: 'int:wd:Q189729', scheme: 'wd', value: 'Q189729' },
			source,
			hints,
		},
	});
const olRequest = (url: string) =>
	createMockRequest({
		input: createMockAtomInput({
			hints: { url },
			jsonLd: { '@context': 'https://schema.org', '@type': 'Book', name: 'Book', url },
		}),
	});

type RefusingSlot = ReturnType<typeof createRefusingAfterSlot>;

type Scenario = {
	provider: string;
	/** Runs the plugin once against `slot`; whatever it throws is irrelevant here. */
	run: (slot: RefusingSlot) => Promise<unknown>;
};

async function scenarios(): Promise<Scenario[]> {
	const work = await json('openlibrary', 'work.json');
	const noCover = await json('openlibrary', 'work-without-cover.json');
	const editions = await json('openlibrary', 'editions-with-covers.json');
	const author = await json('openlibrary', 'author.json');
	const edition = await json('openlibrary', 'edition.json');
	const wikidataEntity = await json('wikidata', 'entity.json');
	const summary = await json('wikipedia', 'summary.json');
	const olFetch = createPinAwareFetch(async (input) => {
		const url = String(input);
		if (url.includes('/authors/')) return Response.json(author);
		if (url.includes('/editions.json')) return Response.json(editions);
		if (url.includes('/books/') || url.includes('/isbn/')) return Response.json(edition);
		return Response.json(url.includes('OL1W') ? noCover : work);
	});
	const ol = (url: string) => (slot: RefusingSlot) =>
		createOpenLibraryPlugin({ fetch: olFetch, requestSlot: slot, maxAuthorFetches: 2 }).enrich(
			olRequest(url),
			createMockPluginContext()
		);
	const mbFetch = createPinAwareFetch(async (url) =>
		Response.json(
			String(url).includes('/recording/')
				? { id: MBID, title: 'Song' }
				: { recordings: [{ id: MBID, title: 'Song' }] }
		)
	);
	const mb = (hints: Record<string, unknown>) => (slot: RefusingSlot) =>
		createMusicBrainzPlugin({ fetch: mbFetch, requestSlot: slot }).enrich(
			mbInput(hints),
			createMockPluginContext()
		);
	const wikiFetch = createPinAwareFetch(async (url) => {
		const text = String(url);
		if (text.includes('wbsearchentities')) {
			return Response.json({ searchinfo: { search: 'x' }, search: [{ id: 'Q12345' }], success: 1 });
		}
		if (text.includes('/page/summary/')) {
			return Response.json({ ...(summary as object), wikibase_item: 'Q12345' });
		}
		return Response.json({
			entities: {
				Q12345: {
					...(wikidataEntity as { entities: { Q12345: object } }).entities.Q12345,
					id: 'Q12345',
				},
			},
		});
	});
	const wikidata = (hints: Record<string, unknown>) => (slot: RefusingSlot) =>
		createWikidataPlugin({ fetch: wikiFetch, requestSlot: slot }).enrich(
			createMockRequest({ input: createMockAtomInput({ hints }) }),
			createMockPluginContext()
		);
	return [
		{ provider: 'openlibrary', run: ol('https://openlibrary.org/works/OL45804W') },
		{ provider: 'openlibrary', run: ol('https://openlibrary.org/works/OL1W') },
		{ provider: 'openlibrary', run: ol('https://openlibrary.org/books/OL7353617M') },
		{ provider: 'openlibrary', run: ol('https://openlibrary.org/isbn/9780140328721') },
		{ provider: 'musicbrainz', run: mb({ identifiers: { mbid: MBID } }) },
		{ provider: 'musicbrainz', run: mb({ identifiers: { isrc: 'GBUM71029604' } }) },
		{
			provider: 'musicbrainz',
			run: (slot) =>
				createMusicBrainzPlugin({ fetch: mbFetch, requestSlot: slot }).enrich(
					createMockRequest({
						input: {
							atomType: 'song',
							jsonLd: {
								'@context': 'https://schema.org',
								'@type': 'MusicRecording',
								name: 'Song',
							},
							source,
						},
					}),
					createMockPluginContext()
				),
		},
		{ provider: 'wikidata', run: wikidata({ identifiers: { wikidata: 'Q12345' } }) },
		{ provider: 'wikidata', run: wikidata({ name: 'Acme Labs' }) },
		{
			provider: 'wikipedia',
			run: (slot) =>
				createWikipediaPlugin({ fetch: wikiFetch, requestSlot: slot }).enrich(
					createMockRequest({
						input: createMockAtomInput({
							hints: { name: 'Acme Labs', url: 'https://en.wikipedia.org/wiki/Acme_Labs' },
						}),
					}),
					createMockPluginContext()
				),
		},
	];
}

describe('every operation that uses a process slot declares budget_exhausted (ENG-17085)', () => {
	test('the operations that went through a refusing slot all declare it, and each provider has some', async () => {
		const slotted = new Map<string, Set<string>>();
		for (const scenario of await scenarios()) {
			for (const admit of [0, 1, 2, 3]) {
				events = [];
				const slot = createRefusingAfterSlot(admit);
				await scenario.run(slot).catch(() => undefined);
				for (const event of events) {
					if (event.type !== 'provider_request') continue;
					const live = event as ProviderRequestEvent;
					if (live.source !== 'live') continue;
					const id = `${live.provider}|${live.operation}`;
					const set = slotted.get(scenario.provider) ?? new Set<string>();
					set.add(id);
					slotted.set(scenario.provider, set);
				}
			}
		}
		for (const provider of ['openlibrary', 'musicbrainz', 'wikidata', 'wikipedia']) {
			expect(slotted.get(provider)?.size ?? 0, provider).toBeGreaterThan(0);
		}
		const undeclared = [...slotted.values()]
			.flatMap((ids) => [...ids])
			.filter((id) => {
				const [provider, operation] = id.split('|') as [never, never];
				return !lookupProviderOperation(provider, operation)?.liveOutcomes.includes(
					'budget_exhausted'
				);
			});
		expect(undeclared).toEqual([]);
		// Pinned exactly: a new slotted operation must be added here on purpose, and a lost one is noticed.
		const sorted = (provider: string) => [...(slotted.get(provider) ?? [])].sort();
		expect(sorted('openlibrary')).toEqual([
			'openlibrary|author',
			'openlibrary|book',
			'openlibrary|editions',
			'openlibrary|isbn',
			'openlibrary|work',
		]);
		expect(sorted('musicbrainz')).toEqual([
			'musicbrainz|isrc',
			'musicbrainz|recording',
			'musicbrainz|search',
		]);
		expect(sorted('wikidata')).toEqual(['wikidata|entity', 'wikidata|search']);
		expect(sorted('wikipedia')).toEqual(['wikipedia|summary']);
		// Guard: the enrichment plugins of these providers all pace through a slot, so every operation
		// the registry declares for the enrichment scope must be reached by a scenario. One declared
		// but unreached (a new route, or a plugin missing from `scenarios()`) fails here instead of
		// escaping the check above.
		const reached = new Set([...slotted.values()].flatMap((ids) => [...ids]));
		const unreached = registeredOperationsForScope('enrichment')
			.filter(({ provider }) => slotted.has(provider))
			.map(({ provider, operation }) => `${provider}|${operation}`)
			.filter((id) => !reached.has(id));
		expect(unreached).toEqual([]);
	});
});
