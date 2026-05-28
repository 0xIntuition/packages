#!/usr/bin/env node

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const specsPath = resolve(repoRoot, 'packages/predicates/src/generated/predicate-specs.ts');
const outputRoot = resolve(repoRoot, 'packages/predicates/src/standalone');

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

function extractPredicateKeys(sourceFile) {
	for (const statement of sourceFile.statements) {
		if (!ts.isVariableStatement(statement)) {
			continue;
		}

		for (const declaration of statement.declarationList.declarations) {
			if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'PREDICATE_SPECS') {
				continue;
			}

			const initializer = declaration.initializer && unwrapExpression(declaration.initializer);
			if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
				throw new Error('PREDICATE_SPECS must be an array literal.');
			}

			return initializer.elements.map((element) => {
				const objectLiteral = unwrapExpression(element);
				if (!ts.isObjectLiteralExpression(objectLiteral)) {
					throw new Error('Every predicate spec must be an object literal.');
				}

				const keyProperty = objectLiteral.properties.find(
					(property) =>
						ts.isPropertyAssignment(property) && getPropertyNameText(property.name) === 'key'
				);

				if (!keyProperty || !ts.isPropertyAssignment(keyProperty)) {
					throw new Error('Every predicate spec must include a key property.');
				}

				const keyInitializer = unwrapExpression(keyProperty.initializer);
				if (!ts.isStringLiteral(keyInitializer)) {
					throw new Error('Every predicate spec key must be a string literal.');
				}

				return keyInitializer.text;
			});
		}
	}

	throw new Error('Could not find PREDICATE_SPECS.');
}

function isIdentifier(value) {
	return /^[$A-Z_a-z][$\w]*$/.test(value);
}

function moduleSourceForKey(key) {
	const namedExports = isIdentifier(key)
		? `\nexport const ${key} = predicate;\nexport const ${key}Id = id;\nexport const ${key}AtomData = atomData;\n`
		: '\n';

	return `import {
\tgetPredicateAtomData,
\tgetPredicateId,
\tgetPredicateRecord,
\ttype PredicateKey,
} from '../predicates.js';

export const key = '${key}' satisfies PredicateKey;
const predicateRecord = getPredicateRecord(key);

if (!predicateRecord) {
\tthrow new Error('Missing generated predicate record for "${key}".');
}

export const predicate = predicateRecord;
export const id = getPredicateId(key);
export const atomData = getPredicateAtomData(key);${namedExports}
export default predicate;
`;
}

const sourceText = readFileSync(specsPath, 'utf8');
const sourceFile = ts.createSourceFile(specsPath, sourceText, ts.ScriptTarget.Latest, true);
const predicateKeys = extractPredicateKeys(sourceFile);

rmSync(outputRoot, { force: true, recursive: true });
mkdirSync(outputRoot, { recursive: true });

for (const key of predicateKeys) {
	writeFileSync(resolve(outputRoot, `${key}.ts`), moduleSourceForKey(key));
}

console.log(`Generated ${predicateKeys.length} standalone predicate modules.`);
