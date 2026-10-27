import { describe, expect, it } from 'bun:test';

import { createIntuitionIdPlugin } from '../src';
import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

describe('Intuition identifier plugin', () => {
	it('exports the int plugin through the public package surface', () => {
		expect(createIntuitionIdPlugin().manifest.id).toBe('int');
	});

	it.each([
		{
			input: 'int:isrc:USQX91300108',
			scheme: 'isrc',
			value: 'USQX91300108',
			schemaType: 'MusicRecording',
			category: 'song',
		},
		{
			input: 'int:mbid:recording:d28cfc80-b16c-47c9-a370-f13f49732e75',
			scheme: 'mbid',
			value: 'recording:d28cfc80-b16c-47c9-a370-f13f49732e75',
			schemaType: 'MusicRecording',
			category: 'song',
		},
		{
			input: 'int:olid:OL443953A',
			scheme: 'olid',
			value: 'OL443953A',
			schemaType: 'Person',
			category: 'person',
		},
	])('resolves $input through the IID registry', async (fixture) => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const result = await engine.classify({
			input: fixture.input,
			mode: 'progressive',
			classificationSessionId: `iid-${fixture.scheme}`,
		});

		expect(result.status).toBe('complete');
		expect(result.classification).toMatchObject({
			type: 'identifier',
			domain: 'intuition',
			meta: {
				scheme: fixture.scheme,
				value: fixture.value,
				canonicalIid: fixture.input,
			},
		});
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: fixture.schemaType,
			category: fixture.category,
			canonicalId: fixture.input,
			hints: { identifiers: { [fixture.scheme]: fixture.value } },
		});
		expect(result.resolved?.atoms[0]?.sameAs).toEqual([]);
		// Pinned interim shape (pre-C6): the engine's legacy validation
		// requires `name`, so resolved-atom data still carries it alongside
		// the canonical identifier. Emission MUST route through
		// buildAtomAnchor (C6), which collapses anchor-eligible identifiers
		// to bare D29 P0 bytes — `anchorEligible` in metadata is the signal.
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			identifier: fixture.input,
		});
		expect(result.resolved?.atoms[0]?.metadata).toMatchObject({ anchorEligible: true });
	});

	it('case-folds an uppercase prefix and scheme before registry resolution', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const result = await engine.classify({
			input: 'INT:ISRC:usqx91300108',
			mode: 'progressive',
			classificationSessionId: 'iid-case-fold',
		});

		expect(result.status).toBe('complete');
		expect(result.classification?.domain).toBe('intuition');
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'int:isrc:USQX91300108',
			hints: { identifiers: { isrc: 'USQX91300108' } },
		});
	});

	it('does not Unicode-trim a forbidden wd edge into a mintable IID', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const result = await engine.classify({
			input: 'int:wd:film:Q42\u00A0',
			mode: 'progressive',
			classificationSessionId: 'iid-wd-unicode-edge',
		});

		expect(result.status).toBe('placeholder');
		expect(result.classification).toBeUndefined();
		expect(result.resolved).toBeUndefined();
	});

	it('keeps a valid polymorphic IID generic but enrichable', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const result = await engine.classify({
			input: 'int:wd:Q42',
			mode: 'progressive',
			classificationSessionId: 'iid-wd-polymorphic',
		});

		expect(result.status).toBe('complete');
		expect(result.classification?.domain).toBe('intuition');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'Thing',
			category: 'thing',
			canonicalId: 'int:wd:Q42',
			hints: { identifiers: { wd: 'Q42' } },
		});
	});

	it.each([
		'int:bogus:x',
		'int:isrc:notanisrc',
		'int:isrc:X',
	])('does not classify or plain-text-rescue malformed IID input: %s', async (input) => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const result = await engine.classify({
			input,
			mode: 'progressive',
			classificationSessionId: `invalid-${input}`,
		});

		expect(result.status).toBe('placeholder');
		expect(result.classification).toBeUndefined();
		expect(result.resolved).toBeUndefined();
	});

	it('preserves legacy URL, JSON, and plain-text classification behavior', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const fixtures = [
			{ input: 'https://example.com', status: 'complete', domain: 'web', schemaType: 'WebSite' },
			{
				input: '{"@type":"Person","name":"Ada"}',
				status: 'placeholder',
				domain: undefined,
				schemaType: undefined,
			},
			{
				input: 'semantic grounding',
				status: 'complete',
				domain: 'plain-text',
				schemaType: 'Thing',
			},
		] as const;

		for (const fixture of fixtures) {
			const result = await engine.classify({
				input: fixture.input,
				mode: 'progressive',
				classificationSessionId: `legacy-${fixture.domain}`,
			});

			expect(result.status).toBe(fixture.status);
			expect(result.classification?.domain).toBe(fixture.domain);
			expect(
				result.resolved?.atoms[0]?.schemaType ?? result.resolved?.classifications[0]?.type
			).toBe(fixture.schemaType);
		}
	});
});
