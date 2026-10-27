import { describe, expect, it } from 'bun:test';
import type { ResolverAtom } from '../src/plugins';
import { createImdbPlugin, imdbProfile } from '../src/plugins/imdb';
import type { PlatformStageAdapter } from '../src/plugins/shared/platform';
import { createV0TypeProfilesPlugin } from '../src/plugins/type-profiles';
import { createServerEngine } from '../src/server';

const input = 'https://www.imdb.com/title/tt0137523/';
const placeholder: ResolverAtom = {
	schemaType: 'Movie',
	category: 'thing',
	title: 'IMDb Title tt0137523',
	canonicalId: 'imdb:title:tt0137523',
	data: { '@type': 'Movie', name: 'IMDb Title tt0137523', identifier: 'int:imdb:tt0137523' },
};
const classify = (plugin: ReturnType<typeof createImdbPlugin>) =>
	createServerEngine({
		onClassifierError: () => undefined,
		plugins: [createV0TypeProfilesPlugin(), plugin],
	}).classify({ input, mode: 'server-only' });

function expectUnavailable(result: Awaited<ReturnType<typeof classify>>) {
	expect(result.resolved?.atoms ?? []).toEqual([]);
	expect(result.classification?.meta.acquisitionOutcome).toMatchObject({
		status: 'unavailable',
		terminal: true,
	});
}

describe('IMDb plugin acquisition boundary', () => {
	for (const slot of ['domainHtml', 'domainApi', 'publicMetadata', 'oEmbed', 'openGraph']) {
		it(`rejects the legacy ${slot} page adapter before its fixture 403 request`, async () => {
			const requests: string[] = [];
			const fetch = (url: string) => {
				requests.push(url);
				return Promise.resolve(new Response(null, { status: 403 }));
			};
			const adapter: PlatformStageAdapter = async ({ canonicalUrl }) => {
				await fetch(canonicalUrl);
				return placeholder;
			};
			const legacyOptions = {
				useDefaultDomainHtmlAdapter: false,
				credentials: { imdb: { enabled: true } },
				adapters: { [slot]: adapter },
			};
			const result = await classify(createImdbPlugin(legacyOptions));
			expect(requests).toEqual([]);
			expectUnavailable(result);
		});
	}
	it('rejects a custom adapter returning a placeholder without a request', async () => {
		let calls = 0;
		const legacyOptions = {
			useDefaultDomainHtmlAdapter: false,
			adapters: {
				domainHtml: () => {
					calls++;
					return placeholder;
				},
			},
		};
		const result = await classify(createImdbPlugin(legacyOptions));
		expectUnavailable(result);
		expect(calls).toBe(0);
	});
	for (const [label, atom] of [
		[
			'missing acquisition metadata',
			{ ...placeholder, title: 'Fight Club', data: { name: 'Fight Club' } },
		],
		[
			'placeholder with hit metadata',
			{ ...placeholder, metadata: { imdbBridge: { status: 'hit', hits: 1 } } },
		],
		[
			'ambiguous acquisition',
			{
				...placeholder,
				title: 'Fight Club',
				data: { name: 'Fight Club' },
				metadata: { imdbBridge: { status: 'ambiguous', hits: 2 } },
			},
		],
		[
			'unavailable acquisition',
			{
				...placeholder,
				title: 'Fight Club',
				data: { name: 'Fight Club' },
				metadata: { imdbBridge: { status: 'unavailable', hits: 0 } },
			},
		],
	] as const) {
		it(`independently rejects resolver output with ${label}`, async () => {
			const original = imdbProfile.resolveGeneric;
			try {
				imdbProfile.resolveGeneric = () => atom;
				expectUnavailable(await classify(createImdbPlugin({ useDefaultDomainHtmlAdapter: false })));
			} finally {
				imdbProfile.resolveGeneric = original;
			}
		});
	}
});
