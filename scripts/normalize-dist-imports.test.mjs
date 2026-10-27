import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('normalizes dotted module basenames for Node and declarations', () => {
	const root = mkdtempSync(join(tmpdir(), 'normalize-dist-'));
	try {
		mkdirSync(join(root, 'dist'));
		writeFileSync(join(root, 'package.json'), '{"type":"module"}');
		writeFileSync(join(root, 'dist', 'metrics.expected.js'), 'export const value = 42;');
		writeFileSync(join(root, 'dist', 'metrics.expected.d.ts'), 'export declare const value: 42;');
		for (const file of ['index.js', 'index.d.ts'])
			writeFileSync(join(root, 'dist', file), "export { value } from './metrics.expected';\n");
		execFileSync(
			process.execPath,
			[fileURLToPath(new URL('./normalize-dist-imports.mjs', import.meta.url))],
			{ cwd: root }
		);
		for (const file of ['index.js', 'index.d.ts'])
			assert.match(readFileSync(join(root, 'dist', file), 'utf8'), /metrics\.expected\.js/);
		assert.equal(
			execFileSync(
				process.execPath,
				['--input-type=module', '-e', "import {value} from './dist/index.js'; console.log(value)"],
				{ cwd: root, encoding: 'utf8' }
			).trim(),
			'42'
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
