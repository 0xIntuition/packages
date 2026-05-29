#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import ts from 'typescript';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const generatedRoot = resolve(repoRoot, 'packages/predicates/src/generated');
const specsRoot = resolve(generatedRoot, 'specs');
const generatedIndexPath = resolve(generatedRoot, 'index.ts');
const standaloneRoot = resolve(repoRoot, 'packages/predicates/src/standalone');

function unwrapExpression(expression) {
	if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
		return unwrapExpression(expression.expression);
	}

	return expression;
}

function getPropertyNameText(name) {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
		return name.text;
	}

	return undefined;
}

function findKeyInObjectLiteral(objectLiteral) {
	const keyProperty = objectLiteral.properties.find(
		(property) => ts.isPropertyAssignment(property) && getPropertyNameText(property.name) === 'key'
	);

	if (!keyProperty || !ts.isPropertyAssignment(keyProperty)) {
		throw new Error('Every predicate spec must include a key property.');
	}

	const keyInitializer = unwrapExpression(keyProperty.initializer);
	if (!ts.isStringLiteral(keyInitializer)) {
		throw new Error('Every predicate spec key must be a string literal.');
	}

	return keyInitializer.text;
}

function parseSourceFile(filePath) {
	return ts.createSourceFile(
		filePath,
		readFileSync(filePath, 'utf8'),
		ts.ScriptTarget.Latest,
		true
	);
}

function extractSpecModule(filePath) {
	const sourceFile = parseSourceFile(filePath);

	for (const statement of sourceFile.statements) {
		if (!ts.isVariableStatement(statement)) {
			continue;
		}

		for (const declaration of statement.declarationList.declarations) {
			if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
				continue;
			}

			const objectLiteral = unwrapExpression(declaration.initializer);
			if (!ts.isObjectLiteralExpression(objectLiteral)) {
				continue;
			}

			return {
				exportName: declaration.name.text,
				fileStem: basename(filePath, '.ts'),
				key: findKeyInObjectLiteral(objectLiteral),
			};
		}
	}

	throw new Error(`Could not find exported predicate spec in ${filePath}.`);
}

function getSpecFiles() {
	if (!existsSync(specsRoot)) {
		return [];
	}

	return readdirSync(specsRoot)
		.filter((entry) => entry.endsWith('.ts'))
		.map((entry) => resolve(specsRoot, entry));
}

function readExistingIndexOrder() {
	if (!existsSync(generatedIndexPath)) {
		return new Map();
	}

	const order = new Map();
	const indexSource = readFileSync(generatedIndexPath, 'utf8');
	const specsMatch = indexSource.match(
		/export const PREDICATE_SPECS = \[\n(?<entries>[\s\S]*?)\n\] as const/
	);

	if (!specsMatch?.groups?.entries) {
		return order;
	}

	for (const [position, entry] of specsMatch.groups.entries
		.split('\n')
		.map((line) => line.trim().replace(/,$/, ''))
		.filter(Boolean)
		.entries()) {
		const exportName = entry;
		order.set(exportName, position);
	}

	return order;
}

function loadSpecModules() {
	const existingOrder = readExistingIndexOrder();
	const modules = getSpecFiles().map(extractSpecModule);

	if (modules.length === 0) {
		throw new Error('No predicate spec modules found.');
	}

	return modules.sort((left, right) => {
		const leftOrder = existingOrder.get(left.exportName);
		const rightOrder = existingOrder.get(right.exportName);

		if (leftOrder !== undefined && rightOrder !== undefined) {
			return leftOrder - rightOrder;
		}

		if (leftOrder !== undefined) {
			return -1;
		}

		if (rightOrder !== undefined) {
			return 1;
		}

		return left.fileStem.localeCompare(right.fileStem);
	});
}

function writeGeneratedIndex(modules) {
	const sortedModules = [...modules].sort((left, right) =>
		left.fileStem.localeCompare(right.fileStem)
	);
	const imports = sortedModules
		.map(({ exportName, fileStem }) => `import { ${exportName} } from './specs/${fileStem}.js';`)
		.join('\n');
	const exports = sortedModules
		.map(({ exportName, fileStem }) => `export { ${exportName} } from './specs/${fileStem}.js';`)
		.join('\n');
	const entries = modules.map(({ exportName }) => `\t${exportName},`).join('\n');

	writeFileSync(
		generatedIndexPath,
		`import type { PredicateSpec } from '../types.js';
${imports}

${exports}

export const PREDICATE_SPECS = [
${entries}
] as const satisfies readonly PredicateSpec[];
`
	);
}

function isIdentifier(value) {
	return /^[$A-Z_a-z][$\w]*$/.test(value);
}

function standaloneModuleSource({ exportName, fileStem }) {
	const namedExports = isIdentifier(exportName)
		? `
export const ${exportName}Spec = spec;
export const ${exportName} = predicate;
export const ${exportName}Id = id;
export const ${exportName}AtomData = atomData;
`
		: '\n';

	return `import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { ${exportName} as predicateSpec } from '../generated/specs/${fileStem}.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);${namedExports}
export default predicate;
`;
}

function writeStandaloneModules(modules) {
	rmSync(standaloneRoot, { force: true, recursive: true });
	mkdirSync(standaloneRoot, { recursive: true });

	for (const specModule of modules) {
		writeFileSync(
			resolve(standaloneRoot, `${specModule.fileStem}.ts`),
			standaloneModuleSource(specModule)
		);
	}
}

const specModules = loadSpecModules();

writeGeneratedIndex(specModules);
writeStandaloneModules(specModules);

console.log(`Generated ${specModules.length} predicate spec index and standalone modules.`);
