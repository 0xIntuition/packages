import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import ts from 'typescript';

const SOURCE_ROOT = join(import.meta.dir, '..', 'src');

describe('runtime env injection', () => {
	it('keeps process.env reads inside named FromEnv helpers', async () => {
		const violations: string[] = [];
		for await (const relativePath of new Bun.Glob('**/*.ts').scan(SOURCE_ROOT)) {
			const path = join(SOURCE_ROOT, relativePath);
			const sourceText = await Bun.file(path).text();
			const source = ts.createSourceFile(
				path,
				sourceText,
				ts.ScriptTarget.Latest,
				true,
				ts.ScriptKind.TS
			);

			const visit = (node: ts.Node): void => {
				if (
					ts.isPropertyAccessExpression(node) &&
					node.expression.getText(source) === 'process' &&
					node.name.text === 'env' &&
					!isInsideFromEnvHelper(node)
				) {
					const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
					violations.push(`${relativePath}:${line}`);
				}
				ts.forEachChild(node, visit);
			};
			visit(source);
		}

		expect(violations).toEqual([]);
	}, 30_000);
});

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
