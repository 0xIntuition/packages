import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	INTENTIONALLY_UNMAPPED_PROVIDER_PREFIXES,
	PROVIDER_PREFIX_MAPPINGS,
} from '@0xintuition/iid-ladder';
import { collectAtomIdentifiers } from '../src/collect-atom-identifiers';

const SOURCE_ROOT = join(import.meta.dir, '..', 'src');
const PLUGIN_ROOT = join(SOURCE_ROOT, 'plugins');
const PREFIX_LITERAL = /['"`]((?:[a-z][a-z0-9-]*:)+)(?=\$\{|['"`])/g;
// The window scanner also sees data.identifier literals beside canonicalId.
const NON_CANONICAL_DATA_PREFIXES = new Set(['int:olid:', 'int:imdb:', 'int:']);

const DYNAMIC_EMISSION_AUDITS = [
	{
		file: 'plugins/openlibrary/index.ts',
		needle: 'const canonicalId = `openlibrary:' + '$' + '{subtype}:' + '$' + '{olid}`;',
		prefixes: ['openlibrary:work:', 'openlibrary:book:'],
	},
	{
		file: 'plugins/tmdb/index.ts',
		needle: 'canonicalId: `tmdb:' + '$' + '{mediaType}:' + '$' + '{tmdbId}`',
		prefixes: ['tmdb:movie:', 'tmdb:tv:'],
	},
	{
		file: 'plugins/places/identity.ts',
		needle: 'return `places:' + '$' + '{urlSlug}`;',
		prefixes: ['places:'],
	},
] as const;

const STRUCTURAL_EMISSION_AUDITS = [
	{
		file: 'engine.ts',
		needle: 'return `term:' + '$' + '{termCode}`;',
		prefix: 'term:',
	},
	{
		file: 'plugins/int/index.ts',
		needle: 'canonicalId: iid.canonicalIid',
		prefix: null,
	},
	{
		file: 'plugins/default-url/index.ts',
		needle: 'canonicalId: canonicalUrl',
		prefix: null,
	},
] as const;

function sourceFiles(directory: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...sourceFiles(path));
		} else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
			files.push(path);
		}
	}
	return files;
}

function prefixesFromRealCanonicalIdSites(): Set<string> {
	const prefixes = new Set<string>();
	for (const file of sourceFiles(PLUGIN_ROOT)) {
		const source = readFileSync(file, 'utf8');
		let offset = 0;
		while (true) {
			const canonicalIdOffset = source.indexOf('canonicalId', offset);
			if (canonicalIdOffset < 0) {
				break;
			}
			const emissionWindow = source.slice(canonicalIdOffset, canonicalIdOffset + 320);
			for (const match of emissionWindow.matchAll(PREFIX_LITERAL)) {
				if (match[1]) {
					prefixes.add(match[1]);
				}
			}
			offset = canonicalIdOffset + 'canonicalId'.length;
		}
	}
	return prefixes;
}

function readSource(relativePath: string): string {
	return readFileSync(join(SOURCE_ROOT, relativePath), 'utf8');
}

describe('IID ladder emission conformance', () => {
	test('audits every mapping row against a real canonical or alias emission', () => {
		const discoveredPrefixes = prefixesFromRealCanonicalIdSites();
		const concretePrefixes = new Set(discoveredPrefixes);
		for (const [field, prefix] of [
			['podcastIndexId', 'podcast-index:'],
			['itunesId', 'apple-podcasts:'],
		]) {
			const aliases = collectAtomIdentifiers({
				schemaType: 'PodcastSeries',
				hints: { identifiers: { [field!]: '360084272' } },
			});
			expect(aliases).toContain(`int:${prefix}360084272`);
			concretePrefixes.add(prefix!);
		}
		for (const audit of DYNAMIC_EMISSION_AUDITS) {
			expect(readSource(audit.file), audit.file).toContain(audit.needle);
			for (const prefix of audit.prefixes) {
				concretePrefixes.add(prefix);
			}
		}

		for (const mapping of PROVIDER_PREFIX_MAPPINGS) {
			expect(concretePrefixes.has(mapping.providerPrefix), mapping.providerPrefix).toBe(true);
		}
	});

	test('keeps every plugin-emitted prefix mapped or explicitly structural', () => {
		const emittedPrefixes = prefixesFromRealCanonicalIdSites();
		for (const audit of STRUCTURAL_EMISSION_AUDITS) {
			expect(readSource(audit.file), audit.file).toContain(audit.needle);
			if (audit.prefix) {
				emittedPrefixes.add(audit.prefix);
			}
		}

		for (const emittedPrefix of emittedPrefixes) {
			if (NON_CANONICAL_DATA_PREFIXES.has(emittedPrefix)) {
				continue;
			}
			const coveredByMapping = PROVIDER_PREFIX_MAPPINGS.some(
				({ providerPrefix }) =>
					providerPrefix === emittedPrefix || providerPrefix.startsWith(emittedPrefix)
			);
			const intentionallyUnmapped = INTENTIONALLY_UNMAPPED_PROVIDER_PREFIXES.includes(
				emittedPrefix as (typeof INTENTIONALLY_UNMAPPED_PROVIDER_PREFIXES)[number]
			);
			expect(coveredByMapping || intentionallyUnmapped, emittedPrefix).toBe(true);
		}
	});

	test('pins the GitHub organization byte shape from the domain API adapter', () => {
		expect(readSource('plugins/github/domain-api-adapter.ts')).toContain(
			'$' +
				"{isOrganization ? 'github:org:' : 'github:user:'}" +
				'$' +
				'{resolvedLogin.toLowerCase()}'
		);
	});
});
