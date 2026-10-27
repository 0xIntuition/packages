import { describe, expect, it } from 'bun:test';

import { createExampleLexicalSignalPlugin } from '../../../examples/atom-classification-plugin/src';
import { createClassificationEngine } from '../src/engine';
import { validatePluginManifest } from '../src/plugins';
import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

describe('external plugin compatibility harness', () => {
	it('validates external plugin manifests against the shared contract', () => {
		const plugin = createExampleLexicalSignalPlugin();
		expect(() => validatePluginManifest(plugin.manifest)).not.toThrow();
	});

	it('produces deterministic output across repeated runs', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: [...createDefaultTestPlugins(), createExampleLexicalSignalPlugin()],
		});

		const request = {
			input: 'idea: semantic grounding',
			mode: 'progressive' as const,
			classificationSessionId: 'external-plugin-compat',
		};

		const first = await engine.classify(request);
		const second = await engine.classify({
			...request,
			classificationSessionId: 'external-plugin-compat-replay',
		});

		expect(first.classification?.domain).toBe('lexical');
		expect(first.classification?.subtype).toBe('seed-term');
		expect(first.resolved?.resolverId).toBe('example-lexical-signal-resolver');
		expect(first.resolved?.atoms[0]?.canonicalId).toBe('example-term:semantic-grounding');
		expect(first.resolved?.dedupeKey).toBe(second.resolved?.dedupeKey);
	});

	it('fails init when declared dependencies are not installed', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			autoInit: false,
			plugins: [
				createExampleLexicalSignalPlugin({
					id: 'example-missing-dependency',
				}),
			],
		});

		await expect(engine.init()).rejects.toThrow(/depends on missing plugin "type-profiles"/i);
	});
});
