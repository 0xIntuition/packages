import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ClassificationRegistry } from '../classifications';
import type { EnrichmentPlugin } from '../plugins';
import type { EnrichmentRequest } from '../types';
import { createMockPluginContext } from './mocks';

export interface PluginConformanceFixture {
	name: string;
	request: EnrichmentRequest;
	expectedSupports: boolean;
	expectedClassifications?: string[];
}

export function runPluginConformanceSuite(
	plugin: EnrichmentPlugin,
	fixtures: PluginConformanceFixture[],
	registry: ClassificationRegistry
): void {
	describe(`Plugin conformance: ${plugin.id}`, () => {
		it('has a slug-compliant id', () => {
			assert.match(plugin.id, /^[a-z][a-z0-9-]{0,38}[a-z0-9]$/);
		});

		it('has a semver-like version', () => {
			assert.match(plugin.version, /^\d+\.\d+\.\d+/);
		});

		it('declares a valid runtime', () => {
			assert.ok(['client', 'server', 'universal'].includes(plugin.runtime));
		});

		it('declares at least one artifact type', () => {
			assert.ok(plugin.artifactTypes.length > 0);
		});

		it('declares only registered artifact types', () => {
			for (const slug of plugin.artifactTypes) {
				assert.equal(registry.has(slug), true);
			}
		});

		for (const fixture of fixtures) {
			describe(`fixture: ${fixture.name}`, () => {
				it(`supports() returns ${fixture.expectedSupports}`, async () => {
					const supports = await Promise.resolve(plugin.supports(fixture.request));
					assert.equal(supports, fixture.expectedSupports);
				});

				if (fixture.expectedSupports) {
					it('enrich() returns schema-valid artifacts', async () => {
						const artifacts = await plugin.enrich(fixture.request, createMockPluginContext());
						assert.ok(Array.isArray(artifacts));

						for (const artifact of artifacts) {
							assert.equal(artifact.meta.pluginId, plugin.id);
							assert.ok(artifact.meta.provider);
							assert.match(artifact.meta.fetchedAt, /^\d{4}-\d{2}-\d{2}T/);
							assert.equal(registry.validate(artifact.artifact_type, artifact.data).success, true);
						}
					});
				}

				if (fixture.expectedSupports && fixture.expectedClassifications) {
					it('contains expected classifications', async () => {
						const artifacts = await plugin.enrich(fixture.request, createMockPluginContext());
						const slugs = artifacts.map((artifact) => artifact.artifact_type);
						for (const expected of fixture.expectedClassifications ?? []) {
							assert.ok(slugs.includes(expected));
						}
					});
				}
			});
		}
	});
}
