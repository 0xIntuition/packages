#!/usr/bin/env bun
/** Read-only oracle: run from the pinned app checkout; write only the output argument. */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const app = resolve(process.argv[2] ?? process.cwd());
const output = resolve(process.argv[3] ?? 'provider-local-handles.json');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: app, encoding: 'utf8' }).trim();
if (!commit.startsWith('7fc0c82b4'))
	throw new Error(`Expected pinned app 7fc0c82b4, got ${commit}`);
const oracle = await import(
	pathToFileURL(join(app, 'packages/provider-handles/src/index.ts')).href
);
const upstream = await import(
	pathToFileURL(
		join(app, 'packages/provider-handles/node_modules/@0xintuition/iid-ladder/dist/index.js')
	).href
);
const mappings = upstream.PROVIDER_PREFIX_MAPPINGS.filter((row) => row.kind === 'provider-local');
const sources = new Map();
function collect(value, source) {
	if (value.startsWith('int:')) value = value.slice(4);
	if (!mappings.some((row) => value.startsWith(row.providerPrefix))) return;
	const found = sources.get(value) ?? new Set();
	found.add(source);
	sources.set(value, found);
}
function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
		a.name.localeCompare(b.name)
	)) {
		if (entry.name === 'node_modules' || entry.name === 'dist') continue;
		const file = join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(file);
			continue;
		}
		if (!/\.(?:ts|json)$/.test(entry.name)) continue;
		const source = relative(app, file);
		const text = readFileSync(file, 'utf8');
		if (entry.name.endsWith('.json')) {
			const visit = (value) => {
				if (typeof value === 'string') collect(value, source);
				else if (value && typeof value === 'object') Object.values(value).forEach(visit);
			};
			visit(JSON.parse(text));
		} else {
			const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
			const visit = (node) => {
				if (ts.isStringLiteralLike(node)) collect(node.text, source);
				if (
					ts.isCallExpression(node) &&
					/iidForIdentityRung/i.test(node.expression.getText(tree))
				) {
					const [rung, value] = node.arguments;
					if (rung && value && ts.isStringLiteralLike(rung) && ts.isStringLiteralLike(value))
						collect(`${rung.text}:${value.text}`, source);
				}
				ts.forEachChild(node, visit);
			};
			visit(tree);
		}
	}
}
walk(join(app, 'packages/provider-handles/tests'));
walk(join(app, 'packages/atom-classification/__tests__'));
walk(join(app, 'packages/atom-classification/src/plugins'));
const corpusCount = sources.size;
// Supplement uncovered rows and length/grammar boundaries; oracle still supplies every answer.
for (const row of mappings) {
	const sample = [
		'4Oju8V0OpOaz886J75roH5',
		'dQw4w9WgXcQ',
		'123',
		'example',
		'example.eth',
		'shop.example:product',
		'B000123456',
	].find((value) => row.valuePattern.test(value));
	if (!sample) throw new Error(`Missing sample for ${row.providerPrefix}`);
	for (const suffix of [sample, '', 'not valid', 'a'.repeat(220), 'a'.repeat(221)])
		collect(row.providerPrefix + suffix, 'supplemental grammar/length coverage');
}
const handles = [...sources]
	.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
	.map(([providerCanonicalId, origins]) => {
		const input = { providerCanonicalId };
		return {
			input,
			sources: [...origins].sort(),
			mint: oracle.projectIdentifierLadder(input),
			reject: upstream.projectIdentifierLadder(input),
		};
	});
const projections = [];
const rungs = [];
for (const { input, mint } of handles) {
	if (!mint.iid) continue;
	for (const extra of [
		{ strongIdentifiers: { isrc: 'US-RC1-76-07839' }, strongIdentifierOrder: ['isrc'] },
		{ canonicalUrl: 'https://example.com/item' },
		{ strongIdentifierOrder: upstream.schemeOrderForIdentityCategory('podcast-series') },
	]) {
		const candidate = { ...input, ...extra };
		projections.push({
			input: candidate,
			mint: oracle.projectIdentifierLadder(candidate),
			reject: upstream.projectIdentifierLadder(candidate),
		});
	}
	const row = mappings.find((mapping) =>
		input.providerCanonicalId.startsWith(mapping.providerPrefix)
	);
	const rung = row.providerPrefix.slice(0, -1);
	const value = input.providerCanonicalId.slice(row.providerPrefix.length);
	for (const primarySchemaType of [undefined, 'MusicAlbum', 'PodcastSeries']) {
		const args = [rung, value, primarySchemaType ?? null];
		rungs.push({
			args,
			mint: oracle.iidForIdentityRung(rung, value, primarySchemaType) ?? null,
			reject: upstream.iidForIdentityRung(rung, value, primarySchemaType) ?? null,
		});
	}
}
const command =
	'cd <app-checkout> && bun <packages-checkout>/scripts/generate-provider-local-handles.mjs "$PWD" <packages-checkout>/packages/iid-ladder/__tests__/fixtures/provider-local-handles.json';
writeFileSync(
	output,
	`${JSON.stringify({ provenance: { appCommit: commit, generatingCommand: command, corpusCount, providerLocalPrefixes: mappings.length, oracle: 'packages/provider-handles/src/index.ts (unmodified)', scope: 'provider-handles tests, atom-classification tests/fixtures/plugins, supplemental grammar boundaries' }, handles, projections, rungs }, null, '\t')}\n`
);
console.log(
	JSON.stringify({
		corpusCount,
		prefixes: mappings.length,
		handles: handles.length,
		projections: projections.length,
		rungs: rungs.length,
		output,
		scriptDirectory: dirname(import.meta.path),
	})
);
