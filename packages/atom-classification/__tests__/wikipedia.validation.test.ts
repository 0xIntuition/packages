import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { createTypeProfilesPlugin, createWikipediaPlugin } from '../src/plugins/index';
import { buildWikipediaSummaryEndpoint } from '../src/plugins/wikipedia/domain-api-adapter';
import { createServerEngine } from '../src/server';

type FixtureFile = {
	items: FixtureItem[];
};

type FixtureItem = {
	name: string;
	url: string;
	expectedSchemaType: string;
	summary: Record<string, unknown>;
};

useStubbedPublicDns();

describe('wikipedia recorded typing validation', () => {
	it('matches at least 90% of asserted sampled ground truth rows without network', async () => {
		const fixture = JSON.parse(
			readFileSync(new URL('./fixtures/wikipedia-typing-sample.json', import.meta.url), 'utf8')
		) as FixtureFile;
		const summariesByEndpoint = new Map<string, FixtureItem>();
		for (const item of fixture.items) {
			const title = parseWikipediaTitleFromUrl(item.url);
			if (title) {
				summariesByEndpoint.set(buildWikipediaSummaryEndpoint(item.url, title), item);
			}
		}

		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createWikipediaPlugin({
					fetch: createPinAwareFetch(async (input) => {
						const item = summariesByEndpoint.get(String(input));
						return item ? Response.json(item.summary) : new Response('{}', { status: 404 });
					}),
				}),
			],
		});

		let assertedCount = 0;
		let correctCount = 0;
		const disagreements: string[] = [];

		for (const item of fixture.items) {
			if (!item.expectedSchemaType) {
				continue;
			}

			assertedCount += 1;
			const result = await engine.classify({
				input: item.url,
				mode: 'progressive',
				classificationSessionId: `wikipedia-recorded-validation-${assertedCount}`,
			});
			const actual = result.resolved?.atoms[0]?.schemaType ?? 'UNRESOLVED';
			const accepted = new Set(item.expectedSchemaType.split('|').map((entry) => entry.trim()));
			if (accepted.has(actual)) {
				correctCount += 1;
			} else {
				const description =
					typeof item.summary.description === 'string' ? item.summary.description : '';
				disagreements.push(`${item.expectedSchemaType}\t${actual}\t${item.name}\t${description}`);
			}
		}

		const agreement = assertedCount > 0 ? correctCount / assertedCount : 0;
		if (agreement < 0.9) {
			throw new Error(
				`Wikipedia typing agreement ${(agreement * 100).toFixed(2)}% below 90%:\n${disagreements
					.slice(0, 20)
					.join('\n')}`
			);
		}

		expect(fixture.items).toHaveLength(112);
		expect(assertedCount).toBe(102);
		expect(correctCount).toBe(101);
		expect(agreement).toBeGreaterThanOrEqual(0.9);
	});
});

function parseWikipediaTitleFromUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		const segments = parsed.pathname.split('/').filter(Boolean);
		if (segments[0] !== 'wiki' || segments.length < 2) {
			return undefined;
		}
		return decodeURIComponent(segments.slice(1).join('/')).replace(/_/g, ' ');
	} catch {
		return undefined;
	}
}
