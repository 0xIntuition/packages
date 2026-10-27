import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import ts from 'typescript';

const SOURCE_ROOT = join(import.meta.dir, '..', 'src');

const BYPASS_FIXTURES = [
	'const value = process.env.SECRET;',
	'const value = process["env"].SECRET;',
	'const value = globalThis.process.env.SECRET;',
	'const { env } = process; const value = env.SECRET;',
	'import runtimeProcess from "node:process"; const value = runtimeProcess.env.SECRET;',
	'import { env as runtimeEnv } from "node:process"; const value = runtimeEnv.SECRET;',
	'export { env as runtimeEnv } from "node:process";',
	'export * from "node:process";',
] as const;

describe('mutation-resistant classification env injection guard', () => {
	it('detects direct, aliased, destructured, imported, and re-exported env access', () => {
		for (const fixture of BYPASS_FIXTURES) {
			expect(findForbiddenEnvAccesses(fixture).length, fixture).toBeGreaterThan(0);
		}
	});

	it('keeps runtime sources within named FromEnv helper boundaries', async () => {
		const violations: string[] = [];
		for await (const relativePath of new Bun.Glob('**/*.ts').scan(SOURCE_ROOT)) {
			const sourceText = await Bun.file(join(SOURCE_ROOT, relativePath)).text();
			for (const line of findForbiddenEnvAccesses(sourceText)) {
				violations.push(`${relativePath}:${line}`);
			}
		}

		expect(violations).toEqual([]);
	});
});

function findForbiddenEnvAccesses(sourceText: string): number[] {
	const source = ts.createSourceFile(
		'fixture.ts',
		sourceText,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS
	);
	const processAliases = new Set(['process']);
	const violations: number[] = [];

	for (const statement of source.statements) {
		if (!ts.isImportDeclaration(statement) || !isNodeProcessSpecifier(statement.moduleSpecifier)) {
			continue;
		}
		const clause = statement.importClause;
		if (clause?.name) {
			processAliases.add(clause.name.text);
		}
		if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
			processAliases.add(clause.namedBindings.name.text);
		}
		if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
			for (const element of clause.namedBindings.elements) {
				if ((element.propertyName ?? element.name).text === 'env') {
					pushViolation(violations, source, element);
				}
			}
		}
	}

	const visit = (node: ts.Node): void => {
		if (
			ts.isExportDeclaration(node) &&
			node.moduleSpecifier &&
			isNodeProcessSpecifier(node.moduleSpecifier)
		) {
			pushViolation(violations, source, node);
		} else if (isProcessEnvAccess(node, processAliases) && !isInsideFromEnvHelper(node)) {
			pushViolation(violations, source, node);
		} else if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			isProcessReference(node.initializer, processAliases) &&
			ts.isObjectBindingPattern(node.name) &&
			node.name.elements.some(
				(element) => (element.propertyName ?? element.name).getText(source) === 'env'
			) &&
			!isInsideFromEnvHelper(node)
		) {
			pushViolation(violations, source, node);
		}
		ts.forEachChild(node, visit);
	};
	visit(source);

	return Array.from(new Set(violations));
}

function isProcessEnvAccess(node: ts.Node, processAliases: ReadonlySet<string>): boolean {
	if (ts.isPropertyAccessExpression(node)) {
		return node.name.text === 'env' && isProcessReference(node.expression, processAliases);
	}
	if (ts.isElementAccessExpression(node)) {
		return (
			getStringLiteralText(node.argumentExpression) === 'env' &&
			isProcessReference(node.expression, processAliases)
		);
	}
	return false;
}

function isProcessReference(node: ts.Expression, processAliases: ReadonlySet<string>): boolean {
	if (ts.isIdentifier(node)) {
		return processAliases.has(node.text);
	}
	if (ts.isPropertyAccessExpression(node)) {
		return node.expression.getText() === 'globalThis' && node.name.text === 'process';
	}
	if (ts.isElementAccessExpression(node)) {
		return (
			node.expression.getText() === 'globalThis' &&
			getStringLiteralText(node.argumentExpression) === 'process'
		);
	}
	return false;
}

function getStringLiteralText(node: ts.Expression | undefined): string | undefined {
	return node && ts.isStringLiteralLike(node) ? node.text : undefined;
}

function isNodeProcessSpecifier(node: ts.Expression): boolean {
	return ts.isStringLiteralLike(node) && node.text === 'node:process';
}

function isInsideFromEnvHelper(node: ts.Node): boolean {
	let current: ts.Node | undefined = node;
	while (current) {
		if (ts.isFunctionDeclaration(current)) {
			return current.name?.text.endsWith('FromEnv') ?? false;
		}
		current = current.parent;
	}
	return false;
}

function pushViolation(violations: number[], source: ts.SourceFile, node: ts.Node): void {
	violations.push(source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1);
}
