import { describe, expect, it } from 'bun:test';
import ts from 'typescript';
import fullAllowlist from './fixtures/executable-tmdb-host-allowlist.json';

const SOURCE_ROOTS = ['packages/atom-classification'] as const;
const allowlist = fullAllowlist.filter((entry) =>
	entry.path.startsWith('packages/atom-classification/')
);
const SOURCE_GLOB = '**/*.{cjs,js,jsx,mjs,ts,tsx}';
const HOST_PATTERN = /(?:themoviedb\.org|tmdb\.org)/i;
const REQUEST_PRIMITIVE_PATTERN =
	/(?:\bfetch\s*\(|\bnew\s+Request\s*\(|\bBun\.fetch\b|\bundici\b|\baxios\b|\bhttps?\.(?:get|request)\s*\(|\b(?:ky|got)\s*\()/i;
const EXCLUDED_SEGMENTS = new Set([
	'__tests__',
	'.codex-contracts',
	'contracts',
	'coverage',
	'dist',
	'docs',
	'fixtures',
	'migrations',
	'node_modules',
	'spec',
	'tests',
]);

type AllowlistEntry = (typeof allowlist)[number];
type HostHit = { line: string; lineNumber: number; path: string };

function isAllowlisted(hit: HostHit, entries: readonly AllowlistEntry[] = allowlist): boolean {
	if (REQUEST_PRIMITIVE_PATTERN.test(hit.line)) return false;
	const trimmedLine = hit.line.trim();
	return entries.some(
		(entry: AllowlistEntry) => entry.path === hit.path && trimmedLine === entry.pattern
	);
}

describe('whole-tree executable TMDB host embargo', () => {
	it('requires the licensed IMDb bridge allowlist entry (removal mutant)', async () => {
		const path = 'packages/atom-classification/src/plugins/imdb/domain-html-adapter.ts';
		const source = await Bun.file(
			new URL('../src/plugins/imdb/domain-html-adapter.ts', import.meta.url)
		).text();
		const line = source.split('\n').find((value) => HOST_PATTERN.test(value));
		expect(line).toBeDefined();
		const hit = { path, line: line ?? '', lineNumber: 1 };
		expect(isAllowlisted(hit)).toBe(true);
		expect(
			isAllowlisted(
				hit,
				allowlist.filter((entry) => entry.path !== path)
			)
		).toBe(false);
		expect(allowlist.find((entry) => entry.path === path)?.reason).toContain('2026-09-01 licence');
		expect(source).toContain('buildTmdbFindEndpoint(imdbId, apiKey)');
	});

	it('allows only reasoned parse, alias, display, and denylist source lines', async () => {
		const repoRoot = new URL('../../../', import.meta.url).pathname;
		const hits: HostHit[] = [];

		for (const sourceRoot of SOURCE_ROOTS) {
			const root = `${repoRoot}${sourceRoot}`;
			for await (const relativePath of new Bun.Glob(SOURCE_GLOB).scan({ cwd: root })) {
				if (relativePath.split('/').some((segment) => EXCLUDED_SEGMENTS.has(segment))) continue;
				if (/\.(?:spec|test)\.[cm]?[jt]sx?$/.test(relativePath)) continue;
				const path = `${sourceRoot}/${relativePath}`;
				const text = await Bun.file(`${root}/${relativePath}`).text();
				for (const [index, line] of text.split('\n').entries()) {
					if (HOST_PATTERN.test(line)) hits.push({ line, lineNumber: index + 1, path });
				}
			}
		}

		const unmatched = hits.filter((hit) => !isAllowlisted(hit));
		const stale = allowlist.filter(
			(entry: AllowlistEntry) =>
				!hits.some((hit) => hit.path === entry.path && hit.line.trim() === entry.pattern)
		);

		expect(
			unmatched.map(({ line, lineNumber, path }) => `${path}:${lineNumber}: ${line.trim()}`)
		).toEqual([]);
		expect(stale).toEqual([]);
		expect(allowlist.every((entry: AllowlistEntry) => entry.reason.trim().length > 0)).toBe(true);
	});

	it('retains direct, concatenated, and same-path request mutants as permanent failures', () => {
		const mutants: HostHit[] = [
			{
				line: "fetch('https://api.themoviedb.org/3/movie/550')",
				lineNumber: 1,
				path: 'packages/atom-classification/src/embargo-mutant.ts',
			},
			{
				line: "fetch('https://api.' + 'themoviedb.org/3/movie/550')",
				lineNumber: 1,
				path: 'packages/atom-classification/src/embargo-mutant.ts',
			},
			{
				line: 'fetch(`https://www.themoviedb.org/' + '$' + '{mediaType}/' + '$' + '{tmdbId}`)',
				lineNumber: 1,
				path: 'packages/atom-classification/src/plugins/tmdb/index.ts',
			},
		];

		expect(mutants.map((hit) => isAllowlisted(hit))).toEqual([false, false, false]);
	});
});

// The hostname inventory cannot see a helper result changed into a different route.
// Parse imports and the transport argument independently of that inventory.
function findAuthorizationViolations(source: string, adapter = false): string[] {
	const file = ts.createSourceFile('classifier.ts', source, ts.ScriptTarget.Latest, true);
	const violations: string[] = [];
	const transports: ts.CallExpression[] = [];
	const builders: ts.CallExpression[] = [];
	const visit = (node: ts.Node) => {
		if (
			(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
			node.moduleSpecifier &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			const module = node.moduleSpecifier.text;
			if (module === '@0xintuition/pipeline-runtime' || /pipeline-runtime\/.*tmdb/i.test(module)) {
				const bindings = ts.isImportDeclaration(node)
					? node.importClause?.namedBindings
					: undefined;
				if (
					!ts.isImportDeclaration(node) ||
					node.importClause?.name ||
					!bindings ||
					!ts.isNamedImports(bindings) ||
					bindings.elements.some(
						(element) =>
							(element.propertyName ?? element.name).text !== 'buildTmdbFindEndpoint' ||
							element.name.text !== 'buildTmdbFindEndpoint'
					)
				) {
					violations.push('pipeline-runtime import must expose only buildTmdbFindEndpoint');
				}
			}
		}
		if (ts.isCallExpression(node)) {
			const callee = node.expression.getText(file);
			if (
				(callee === 'require' || node.expression.kind === ts.SyntaxKind.ImportKeyword) &&
				node.arguments.some((arg) => /pipeline-runtime/.test(arg.getText(file)))
			)
				violations.push('dynamic pipeline-runtime import');
			if (adapter && ['fetcher', 'fetch', 'globalThis.fetch'].includes(callee))
				transports.push(node);
			if (adapter && callee === 'buildTmdbFindEndpoint') builders.push(node);
		}
		ts.forEachChild(node, visit);
	};
	visit(file);
	if (
		adapter &&
		(transports.length !== 1 ||
			transports[0]?.expression.getText(file) !== 'fetcher' ||
			transports[0]?.arguments[0]?.getText(file) !== 'buildTmdbFindEndpoint(imdbId, apiKey)' ||
			builders.length !== 1)
	) {
		violations.push('transport URL must be the verbatim /find builder call');
	}
	return violations;
}

describe('classification /find structural authorization', () => {
	it('imports only the /find builder across every classifier source file', async () => {
		const root = new URL('../src/', import.meta.url).pathname;
		const violations: string[] = [];
		for await (const path of new Bun.Glob(SOURCE_GLOB).scan({ cwd: root })) {
			violations.push(
				...findAuthorizationViolations(await Bun.file(`${root}${path}`).text()).map(
					(reason) => `${path}: ${reason}`
				)
			);
		}
		expect(violations).toEqual([]);
	});
	it('passes the /find builder verbatim as the sole transport URL', async () => {
		const source = await Bun.file(
			new URL('../src/plugins/imdb/domain-html-adapter.ts', import.meta.url)
		).text();
		expect(findAuthorizationViolations(source, true)).toEqual([]);
	});
	for (const [label, expression, extraImport, assertion] of [
		[
			'chained non-find route',
			"buildTmdbFindEndpoint(imdbId, apiKey).replace('/find/' + imdbId, '/movie/550')",
			'',
			'transport URL',
		],
		[
			'shared-base template',
			// biome-ignore lint/suspicious/noTemplateCurlyInString: literal TypeScript source for the mutant
			'`${TMDB_API_BASE_URL}/movie/550`',
			"import { TMDB_API_BASE_URL } from '@0xintuition/pipeline-runtime';",
			'pipeline-runtime import',
		],
		[
			'shared-base concatenation',
			"TMDB_API_BASE_URL + '/movie/550'",
			"import { TMDB_API_BASE_URL } from '@0xintuition/pipeline-runtime';",
			'pipeline-runtime import',
		],
		[
			'second TMDB symbol import',
			'buildTmdbFindEndpoint(imdbId, apiKey)',
			"import { TMDB_API_BASE_URL as catalogOrigin } from '@0xintuition/pipeline-runtime';",
			'pipeline-runtime import',
		],
	] as const) {
		it(`rejects ${label} even though the hostname inventory is unchanged`, async () => {
			const source = await Bun.file(
				new URL('../src/plugins/imdb/domain-html-adapter.ts', import.meta.url)
			).text();
			const mutant = `${extraImport}\n${source.replace('fetcher(buildTmdbFindEndpoint(imdbId, apiKey),', `fetcher(${expression},`)}`;
			const hostLines = (text: string) =>
				text.split('\n').filter((line) => HOST_PATTERN.test(line));
			expect(hostLines(mutant)).toEqual(hostLines(source));
			expect(
				findAuthorizationViolations(mutant, true).some((reason) => reason.startsWith(assertion))
			).toBe(true);
			if (label.startsWith('shared-base'))
				expect(findAuthorizationViolations(mutant, true)).toContain(
					'transport URL must be the verbatim /find builder call'
				);
		});
	}
});
