#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const documents = [resolve(root, 'README.md')];
for (const entry of readdirSync(resolve(root, 'packages'), { withFileTypes: true })) {
	if (!entry.isDirectory()) continue;
	const directory = resolve(root, 'packages', entry.name);
	const readme = resolve(directory, 'README.md');
	if (existsSync(readme)) documents.push(readme);
	const docs = resolve(directory, 'docs');
	if (existsSync(docs)) {
		for (const name of readdirSync(docs, { recursive: true })) {
			if (name.endsWith('.md')) documents.push(resolve(docs, name));
		}
	}
}

function resolveExport(specifier) {
	const match = /^@0xintuition\/([^/]+)(.*)$/.exec(specifier);
	if (!match) return undefined;
	const manifestPath = resolve(root, 'packages', match[1], 'package.json');
	// Artifact packages are external inputs, not workspace APIs.
	if (!existsSync(manifestPath)) return undefined;
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
	const subpath = match[2] ? `.${match[2]}` : '.';
	let target = manifest.exports[subpath];
	let wildcard;
	if (!target) {
		for (const [key, value] of Object.entries(manifest.exports)) {
			if (!key.includes('*')) continue;
			const [prefix, suffix] = key.split('*');
			if (subpath.startsWith(prefix) && subpath.endsWith(suffix)) {
				wildcard = subpath.slice(prefix.length, suffix ? -suffix.length : undefined);
				target = value;
				break;
			}
		}
	}
	assert(target, `${specifier}: subpath is not exported`);
	const filename = typeof target === 'string' ? target : (target.types ?? target.import);
	const path = resolve(
		dirname(manifestPath),
		wildcard === undefined ? filename : filename.replaceAll('*', wildcard)
	);
	assert(existsSync(path), `${specifier}: build output missing: ${path}`);
	return path;
}

const imports = [];
const failures = [];
for (const document of documents) {
	const markdown = readFileSync(document, 'utf8');
	for (const block of markdown.matchAll(
		/```(?:ts|tsx|typescript|js|javascript|mjs)\s*\n([\s\S]*?)```/g
	)) {
		const ast = ts.createSourceFile(
			document,
			block[1],
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TSX
		);
		for (const statement of ast.statements) {
			if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
				continue;
			const specifier = statement.moduleSpecifier.text;
			try {
				const path = resolveExport(specifier);
				if (!path) continue;
				const names = [];
				if (statement.importClause?.name) names.push('default');
				const bindings = statement.importClause?.namedBindings;
				if (bindings && ts.isNamedImports(bindings)) {
					names.push(
						...bindings.elements.map((element) => (element.propertyName ?? element.name).text)
					);
				}
				imports.push({ document, specifier, path, names });
			} catch (error) {
				failures.push(`${document}: ${error.message}`);
			}
		}
	}
}
const program = ts.createProgram([...new Set(imports.map((entry) => entry.path))], {
	module: ts.ModuleKind.NodeNext,
	moduleResolution: ts.ModuleResolutionKind.NodeNext,
	target: ts.ScriptTarget.ES2022,
	resolveJsonModule: true,
	allowSyntheticDefaultImports: true,
	skipLibCheck: true,
});
const checker = program.getTypeChecker();
for (const entry of imports) {
	if (entry.path.endsWith('.json')) continue;
	const source = program.getSourceFile(entry.path);
	const symbol = source && checker.getSymbolAtLocation(source);
	const names = new Set(symbol ? checker.getExportsOfModule(symbol).map((item) => item.name) : []);
	for (const name of entry.names) {
		if (!names.has(name))
			failures.push(`${entry.document}: ${entry.specifier} does not export ${name}`);
	}
}
assert.equal(failures.length, 0, failures.join('\n'));
console.log(
	`Validated ${imports.length} workspace imports across ${documents.length} README and docs files.`
);
