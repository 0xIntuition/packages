import { describe, expect, it } from 'bun:test';
import { resolvePublicTestHostname } from '../../../__tests__/helpers/public-dns';
import { createClassificationEngine } from '../../engine';
import { type DomainHtmlFetchLike, fetchHtmlDocumentResult } from '../shared/domain-html/fetch';
import { createTypeProfilesPlugin } from '../type-profiles';
import { createYouTubePlugin } from '../youtube';
import { createDefaultUrlPlugin } from './index';

// default-url now optionally fetches OpenGraph metadata (ENG-13195); pass
// deterministic DNS and transport seams everywhere the OG behavior itself
// isn't under test so no case here ever touches live DNS or the network.
const NO_NETWORK_FETCH = async () => ({ ok: false, status: 404, text: async () => '' });
const NO_NETWORK_OPTIONS = {
	fetch: NO_NETWORK_FETCH,
	resolveHostname: resolvePublicTestHostname,
};

async function fetchHtmlDocument(
	fetcher: DomainHtmlFetchLike,
	input: Parameters<typeof fetchHtmlDocumentResult>[1]
): Promise<string | undefined> {
	const result = await fetchHtmlDocumentResult(fetcher, input);
	return result.ok ? result.value : undefined;
}

describe('default-url plugin', () => {
	it('R2-06 returns timeout before DNS or fetch when the shared deadline is exhausted', async () => {
		let dnsCallCount = 0;
		let fetchCallCount = 0;
		const result = await fetchHtmlDocumentResult(
			async () => {
				fetchCallCount += 1;
				return new Response('ok');
			},
			{
				url: 'https://example.com',
				deadlineAtMs: 0,
				now: () => 1,
				resolveHostname: async () => {
					dnsCallCount += 1;
					return [{ address: '93.184.216.34', family: 4 }];
				},
			}
		);

		expect(result).toEqual({ ok: false, failure: { kind: 'timeout', reason: 'timeout' } });
		expect(dnsCallCount).toBe(0);
		expect(fetchCallCount).toBe(0);
	});

	it('R3-02 returns timeout after DNS crosses the absolute deadline without fetching', async () => {
		let nowMs = 9;
		let fetchCallCount = 0;
		const result = await fetchHtmlDocumentResult(
			async () => {
				fetchCallCount += 1;
				return new Response('ok');
			},
			{
				url: 'https://dns-cross.example',
				deadlineAtMs: 10,
				now: () => nowMs,
				resolveHostname: async () => {
					nowMs = 11;
					return [{ address: '93.184.216.34', family: 4 }];
				},
			}
		);

		expect(result).toEqual({ ok: false, failure: { kind: 'timeout', reason: 'timeout' } });
		expect(fetchCallCount).toBe(0);
	});

	it('R3-02 returns timeout when the absolute deadline crosses between redirect hops', async () => {
		let nowMs = 9;
		let fetchCallCount = 0;
		const result = await fetchHtmlDocumentResult(
			async () => {
				fetchCallCount += 1;
				if (fetchCallCount === 1) {
					nowMs = 11;
					return new Response(null, {
						headers: { location: 'https://redirect-next.example/next' },
						status: 302,
					});
				}
				return new Response('late');
			},
			{
				url: 'https://redirect-cross.example/start',
				deadlineAtMs: 10,
				now: () => nowMs,
				resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
			}
		);

		expect(result).toEqual({ ok: false, failure: { kind: 'timeout', reason: 'timeout' } });
		expect(fetchCallCount).toBe(1);
	});

	it('R3-02 returns timeout when fetch crosses the deadline before the bounded body read', async () => {
		let nowMs = 9;
		let bodyReadCallCount = 0;
		const result = await fetchHtmlDocumentResult(
			async () => {
				nowMs = 11;
				return {
					ok: true,
					status: 200,
					headers: new Headers(),
					body: {
						getReader: () => {
							bodyReadCallCount += 1;
							return {
								read: async () => ({ done: true }),
								cancel: async () => undefined,
								releaseLock: () => undefined,
							};
						},
					},
					text: async () => '',
				};
			},
			{
				url: 'https://body-cross.example',
				deadlineAtMs: 10,
				now: () => nowMs,
				resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
			}
		);

		expect(result).toEqual({ ok: false, failure: { kind: 'timeout', reason: 'timeout' } });
		expect(bodyReadCallCount).toBe(0);
	});

	it('classifies and resolves a generic website URL to WebSite', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [createTypeProfilesPlugin(), createDefaultUrlPlugin(NO_NETWORK_OPTIONS)],
		});

		const result = await engine.classify({
			input: 'https://intuition.systems',
			mode: 'progressive',
			classificationSessionId: 'default-url-generic',
		});

		expect(result.classification?.domain).toBe('web');
		expect(result.classification?.subtype).toBe('website');
		expect(result.resolved?.resolverId).toBe('default-url-resolver');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('WebSite');
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'WebSite',
			url: 'https://intuition.systems',
		});
	});

	it('normalizes a bare domain to an https website URL', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [createTypeProfilesPlugin(), createDefaultUrlPlugin(NO_NETWORK_OPTIONS)],
		});

		const result = await engine.classify({
			input: 'example.com',
			mode: 'progressive',
			classificationSessionId: 'default-url-bare-domain',
		});

		expect(result.classification?.domain).toBe('web');
		expect(result.classification?.subtype).toBe('website');
		expect(result.resolved?.resolverId).toBe('default-url-resolver');
		expect(result.resolved?.atoms[0]?.schemaType).toBe('WebSite');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('https://example.com');
		expect(result.resolved?.atoms[0]?.sameAs).toEqual(['https://example.com']);
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'WebSite',
			url: 'https://example.com',
		});
	});

	it('rejects local and private-network website URLs without fetching them', async () => {
		let fetchCallCount = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createDefaultUrlPlugin({
					fetch: async () => {
						fetchCallCount += 1;
						return { ok: true, status: 200, text: async () => OPENAI_OPEN_GRAPH_HTML };
					},
					resolveHostname: resolvePublicTestHostname,
				}),
			],
		});

		const cases = [
			'localhost:3000',
			'127.0.0.1:3000',
			'https://10.0.0.1',
			'https://172.16.0.1',
			'https://192.168.1.1',
			'https://169.254.169.254/latest/meta-data',
			'https://[::1]',
			'https://[fc00::1]',
			'https://[fe80::1]',
			'https://service.local',
			'https://metadata.internal',
		] as const;

		for (const input of cases) {
			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `default-url-local-${input}`,
			});

			expect(result.classification?.domain).not.toBe('web');
			expect(result.classification?.subtype).not.toBe('website');
			expect(result.resolved?.atoms[0]?.schemaType).not.toBe('WebSite');
			expect(result.resolved?.atoms[0]?.canonicalId).toBeUndefined();
		}

		expect(fetchCallCount).toBe(0);
	});

	it('rejects unsafe schemes at the shared HTML fetch boundary', async () => {
		let fetchCallCount = 0;
		const result = await fetchHtmlDocument(
			async () => {
				fetchCallCount += 1;
				return { ok: true, status: 200, text: async () => OPENAI_OPEN_GRAPH_HTML };
			},
			{ url: 'file:///etc/passwd' }
		);

		expect(result).toBeUndefined();
		expect(fetchCallCount).toBe(0);
	});

	it('rejects DNS names when any resolved address is private', async () => {
		let fetchCallCount = 0;
		const result = await fetchHtmlDocument(
			async () => {
				fetchCallCount += 1;
				return { ok: true, status: 200, text: async () => OPENAI_OPEN_GRAPH_HTML };
			},
			{
				url: 'https://127.0.0.1.nip.io',
				resolveHostname: async () => [
					{ address: '93.184.216.34', family: 4 },
					{ address: '127.0.0.1', family: 4 },
				],
			}
		);

		expect(result).toBeUndefined();
		expect(fetchCallCount).toBe(0);
	});

	it('rejects DNS names resolving to deprecated IPv6 site-local space', async () => {
		let fetchCallCount = 0;
		const result = await fetchHtmlDocument(
			async () => {
				fetchCallCount += 1;
				return { ok: true, status: 200, text: async () => OPENAI_OPEN_GRAPH_HTML };
			},
			{
				url: 'https://site-local.example',
				resolveHostname: async () => [{ address: 'fec0::1', family: 6 }],
			}
		);

		expect(result).toBeUndefined();
		expect(fetchCallCount).toBe(0);
	});

	it('follows safe redirects but rejects a private redirect target before fetching it', async () => {
		const fetchedUrls: string[] = [];
		const fetcher = async (url: string) => {
			fetchedUrls.push(url);
			if (url === 'https://example.com/start') {
				return {
					ok: false,
					status: 302,
					headers: {
						get: (name: string) =>
							name.toLowerCase() === 'location' ? 'https://example.org/article' : null,
					},
					text: async () => '',
				};
			}
			if (url === 'https://example.org/article') {
				return {
					ok: false,
					status: 302,
					headers: {
						get: (name: string) =>
							name.toLowerCase() === 'location' ? 'http://169.254.169.254/latest/meta-data' : null,
					},
					text: async () => '',
				};
			}
			return { ok: true, status: 200, text: async () => 'private data' };
		};

		const result = await fetchHtmlDocument(fetcher, {
			url: 'https://example.com/start',
			resolveHostname: async () => [{ address: '93.184.216.34', family: 4 }],
		});

		expect(result).toBeUndefined();
		expect(fetchedUrls).toEqual(['https://example.com/start', 'https://example.org/article']);
	});

	it('bounds shared HTML fetches when a caller does not provide a signal', async () => {
		const timeoutMarker = Symbol('test timeout');
		const result = await Promise.race([
			fetchHtmlDocument(
				(_url, init) =>
					new Promise((_resolve, reject) => {
						init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
					}),
				{
					url: 'https://example.com',
					resolveHostname: resolvePublicTestHostname,
					timeoutMs: 25,
				}
			),
			new Promise<typeof timeoutMarker>((resolve) => {
				setTimeout(() => resolve(timeoutMarker), 250);
			}),
		]);

		expect(result).toBeUndefined();
	});

	it('keeps the timeout active while reading the response body', async () => {
		const timeoutMarker = Symbol('test timeout');
		const result = await Promise.race([
			fetchHtmlDocument(
				async (_url, init) => ({
					ok: true,
					status: 200,
					text: () =>
						new Promise<string>((_resolve, reject) => {
							init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
						}),
				}),
				{
					url: 'https://example.com',
					timeoutMs: 25,
					resolveHostname: resolvePublicTestHostname,
				}
			),
			new Promise<typeof timeoutMarker>((resolve) => {
				setTimeout(() => resolve(timeoutMarker), 250);
			}),
		]);

		expect(result).toBeUndefined();
	});

	it('rejects response bodies that exceed the configured size cap', async () => {
		const result = await fetchHtmlDocument(
			async () => ({
				ok: true,
				status: 200,
				text: async () => '12345',
			}),
			{
				url: 'https://example.com',
				maxResponseBytes: 4,
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toBeUndefined();
	});

	it('trims common trailing punctuation from pasted website inputs', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [createTypeProfilesPlugin(), createDefaultUrlPlugin(NO_NETWORK_OPTIONS)],
		});

		const cases = [
			{ input: 'https://example.com/about).', expectedCanonicalUrl: 'https://example.com/about' },
			{ input: 'example.com,', expectedCanonicalUrl: 'https://example.com' },
		] as const;

		for (const testCase of cases) {
			const result = await engine.classify({
				input: testCase.input,
				mode: 'progressive',
				classificationSessionId: `default-url-trailing-${testCase.input}`,
			});

			expect(result.classification?.domain).toBe('web');
			expect(result.classification?.subtype).toBe('website');
			expect(result.resolved?.atoms[0]?.schemaType).toBe('WebSite');
			expect(result.resolved?.atoms[0]?.canonicalId).toBe(testCase.expectedCanonicalUrl);
		}
	});

	it('does not treat email-like input as a website URL', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [createTypeProfilesPlugin(), createDefaultUrlPlugin(NO_NETWORK_OPTIONS)],
		});

		const result = await engine.classify({
			input: 'person@example.com',
			mode: 'progressive',
			classificationSessionId: 'default-url-email-like',
		});

		expect(result.classification?.domain).not.toBe('web');
		expect(result.classification?.subtype).not.toBe('website');
		expect(result.resolved?.atoms[0]?.schemaType).not.toBe('WebSite');
		expect(result.resolved?.atoms[0]?.canonicalId).toBeUndefined();
	});

	it('does not treat common file-like dotted identifiers as website URLs', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [createTypeProfilesPlugin(), createDefaultUrlPlugin(NO_NETWORK_OPTIONS)],
		});

		const cases = ['config.json', 'my.component.tsx', 'package-lock.json', 'docker-compose.yml'];

		for (const input of cases) {
			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `default-url-file-like-${input}`,
			});

			expect(result.classification?.domain).not.toBe('web');
			expect(result.classification?.subtype).not.toBe('website');
			expect(result.resolved?.atoms[0]?.schemaType).not.toBe('WebSite');
			expect(result.resolved?.atoms[0]?.canonicalId).toBeUndefined();
		}
	});

	it('does not override more specific URL plugins', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createDefaultUrlPlugin(NO_NETWORK_OPTIONS),
				// The default oEmbed adapter dials through the guarded pinned fetch (ENG-17019); this test is
				// about which resolver wins, so it stays offline.
				createYouTubePlugin({ useDefaultOEmbedAdapter: false }),
			],
		});

		const result = await engine.classify({
			input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			mode: 'progressive',
			classificationSessionId: 'default-url-youtube',
		});

		expect(result.classification?.domain).toBe('youtube');
		expect(result.resolved?.resolverId).toBe('youtube-resolver');
	});

	it('keeps URL-derived identity stable while OpenGraph enriches descriptive fields', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createDefaultUrlPlugin({
					resolveHostname: resolvePublicTestHostname,
					fetch: async () => new Response(OPENAI_OPEN_GRAPH_HTML),
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://openai.com/',
			mode: 'progressive',
			classificationSessionId: 'default-url-opengraph',
		});

		expect(result.resolved?.atoms[0]?.schemaType).toBe('WebSite');
		expect(result.resolved?.atoms[0]?.title).toBe('Website openai.com');
		expect(result.resolved?.atoms[0]?.data).toMatchObject({
			name: 'Website openai.com',
			url: 'https://openai.com',
			description: 'AI research and deployment company',
		});

		const noMetadataEngine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [createTypeProfilesPlugin(), createDefaultUrlPlugin(NO_NETWORK_OPTIONS)],
		});
		const noMetadataResult = await noMetadataEngine.classify({
			input: 'https://openai.com/',
			mode: 'progressive',
			classificationSessionId: 'default-url-without-opengraph',
		});
		const selectIdentity = (
			atom: NonNullable<typeof result.resolved>['atoms'][number] | undefined
		) => ({
			title: atom?.title,
			canonicalId: atom?.canonicalId,
			name: atom?.data.name,
			url: atom?.data.url,
		});

		expect(selectIdentity(result.resolved?.atoms[0])).toEqual(
			selectIdentity(noMetadataResult.resolved?.atoms[0])
		);
	});

	it('falls back to the host-derived name when no fetcher is configured', async () => {
		let dnsLookupCallCount = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createDefaultUrlPlugin({
					// Keep the fetch option omitted so this exercises the guarded
					// default transport. An empty deterministic DNS answer makes
					// the guard fail closed before that transport opens a socket.
					resolveHostname: async () => {
						dnsLookupCallCount += 1;
						return [];
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://openai.com/',
			mode: 'progressive',
			classificationSessionId: 'default-url-opengraph-no-fetch',
		});

		expect(dnsLookupCallCount).toBe(1);
		expect(result.status).toBe('complete');
		expect(result.classification?.domain).toBe('web');
		expect(result.resolved?.atoms[0]?.title).toBe('Website openai.com');
	});

	it('falls back to the host-derived name when OpenGraph metadata has no usable name', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createDefaultUrlPlugin({
					fetch: async () => ({
						ok: true,
						status: 200,
						text: async () => '<html><head></head></html>',
					}),
					resolveHostname: resolvePublicTestHostname,
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://openai.com/',
			mode: 'progressive',
			classificationSessionId: 'default-url-opengraph-empty',
		});

		expect(result.resolved?.atoms[0]?.title).toBe('Website openai.com');
	});

	it('falls back to the host-derived name when the fetch throws', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createDefaultUrlPlugin({
					fetch: async () => {
						throw new Error('network unavailable');
					},
					resolveHostname: resolvePublicTestHostname,
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://openai.com/',
			mode: 'progressive',
			classificationSessionId: 'default-url-opengraph-error',
		});

		expect(result.resolved?.atoms[0]?.title).toBe('Website openai.com');
	});

	// Review finding #1 (partial): bound the OG fetch so an unresponsive
	// arbitrary host can't hang server-side classification. Uses a short
	// override so the test itself doesn't hang for the production default.
	it('falls back to the host-derived name when the fetch never resolves, within the configured timeout', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createDefaultUrlPlugin({
					ogFetchTimeoutMs: 25,
					fetch: (_url, init) =>
						new Promise((_resolve, reject) => {
							init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
						}),
					resolveHostname: resolvePublicTestHostname,
				}),
			],
		});

		const startedAt = Date.now();
		const result = await engine.classify({
			input: 'https://openai.com/',
			mode: 'progressive',
			classificationSessionId: 'default-url-opengraph-timeout',
		});
		const elapsedMs = Date.now() - startedAt;

		expect(result.resolved?.atoms[0]?.title).toBe('Website openai.com');
		expect(elapsedMs).toBeLessThan(2000);
	});

	// Review finding #1 (partial): confirm the scheme is restricted to
	// http/https right before fetching, independent of upstream guarantees —
	// a client-hint-injected classification with no canonicalUrl can reach
	// this resolver with an unvalidated raw input as the fallback "URL".
	it('never attempts a fetch when the resolved canonicalUrl is not http(s)', async () => {
		let fetchCallCount = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createTypeProfilesPlugin(),
				createDefaultUrlPlugin({
					fetch: async () => {
						fetchCallCount += 1;
						return { ok: true, status: 200, text: async () => '' };
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'not a url at all',
			mode: 'progressive',
			classificationSessionId: 'default-url-non-http-scheme',
			clientHints: {
				clientClassification: {
					type: 'url',
					domain: 'web',
					subtype: 'website',
					confidence: 0.5,
					meta: {},
				},
			},
		});

		expect(fetchCallCount).toBe(0);
		expect(result.resolved?.atoms[0]?.title).toBe('Website not a url at all');
	});

	it('records default-url metadata using the actual plugin id', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [createTypeProfilesPlugin(), createDefaultUrlPlugin(NO_NETWORK_OPTIONS)],
		});

		const result = await engine.classify({
			input: 'https://intuition.systems',
			mode: 'progressive',
			classificationSessionId: 'default-url-metadata',
		});

		expect(result.resolved?.atoms[0]?.metadata?.pluginId).toBe('default-url');
		expect(result.resolved?.atoms[0]?.metadata?.provider).toBe('default-url');
	});
});

const OPENAI_OPEN_GRAPH_HTML = `
<html>
	<head>
		<meta property="og:site_name" content="OpenAI" />
		<meta property="og:title" content="OpenAI" />
		<meta property="og:description" content="AI research and deployment company" />
		<title>OpenAI</title>
	</head>
</html>
`;
