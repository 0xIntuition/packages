import { describe, expect, it } from 'bun:test';

import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

describe('steam platform plugin', () => {
	const fixtures = [
		{
			input: 'https://store.steampowered.com/app/570',
			appId: '570',
			canonicalUrl: 'https://store.steampowered.com/app/570/',
		},
		{
			input: 'http://www.store.steampowered.com/app/730/Counter_Strike_2/?l=english',
			appId: '730',
			canonicalUrl: 'https://store.steampowered.com/app/730/',
		},
	] as const;

	for (const fixture of fixtures) {
		it(`classifies Steam app URL ${fixture.appId} as a VideoGame`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input: fixture.input,
				mode: 'progressive',
				classificationSessionId: `steam-app-${fixture.appId}`,
			});

			const atom = result.resolved?.atoms[0];

			expect(result.status).toBe('complete');
			expect(result.classification).toMatchObject({
				domain: 'steam',
				subtype: 'app',
				confidence: 0.99,
				meta: {
					appId: fixture.appId,
					canonicalUrl: fixture.canonicalUrl,
				},
			});
			expect(result.resolved?.resolverId).toBe('steam-resolver');
			expect(atom).toMatchObject({
				schemaType: 'VideoGame',
				category: 'thing',
				title: `Steam App ${fixture.appId}`,
				canonicalId: `steam:app:${fixture.appId}`,
				sameAs: [fixture.canonicalUrl],
			});
			expect(atom?.data).toMatchObject({
				'@type': 'VideoGame',
				identifier: `steam:app:${fixture.appId}`,
				url: fixture.canonicalUrl,
				sameAs: [fixture.canonicalUrl],
			});
			expect(atom?.metadata).toMatchObject({
				pluginId: 'steam',
				provider: 'steam',
				platform: 'steam',
				subtype: 'app',
			});
		});
	}

	const nonMatches = [
		'https://steamcommunity.com/app/570',
		'https://store.steampowered.example/app/570',
		'https://store.steampowered.com/sub/570',
		'https://store.steampowered.com/app/not-an-app-id',
		'https://store.steampowered.com/app/570/Dota_2/extra',
	] as const;

	for (const input of nonMatches) {
		it(`does not classify unsupported Steam URL ${input}`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `steam-non-match-${nonMatches.indexOf(input)}`,
				pluginIds: ['steam'],
			});

			expect(result.classification).toBeUndefined();
			expect(result.resolved).toBeUndefined();
		});
	}
});
