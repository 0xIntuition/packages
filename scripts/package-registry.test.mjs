import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assertRegistryIntegrity, PACKAGES } from './package-registry.mjs';

function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'intuition-registry-'));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const write = (dir, overrides = {}) => {
		const path = join(root, 'packages', dir);
		mkdirSync(path, { recursive: true });
		writeFileSync(
			join(path, 'package.json'),
			JSON.stringify({
				name: `@0xintuition/${dir}`,
				version: '1.0.0',
				private: false,
				...overrides,
			})
		);
	};
	for (const { dirName } of PACKAGES) write(dirName);
	return { root, write };
}

test('rejects a public package omitted from packing and publishing', (t) => {
	const { root, write } = fixture(t);
	write('forgotten');
	assert.throws(() => assertRegistryIntegrity(root), /forgotten: publishable package is missing/);
});

test('allows unregistered private tooling but rejects private release packages', (t) => {
	const { root, write } = fixture(t);
	write('tooling', { private: true });
	assert.doesNotThrow(() => assertRegistryIntegrity(root));
	write('iid', { private: true });
	assert.throws(() => assertRegistryIntegrity(root), /iid: registered package must be public/);
});

test('rejects colliding package names', (t) => {
	const { root, write } = fixture(t);
	write('iid', { name: '@0xintuition/iid-spec' });
	assert.throws(() => assertRegistryIntegrity(root), /duplicate name/);
});

test('rejects mismatched exact pins and invalid publish order', (t) => {
	const { root, write } = fixture(t);
	write('iid', { dependencies: { '@0xintuition/react': '0.1.0' } });
	assert.throws(
		() => assertRegistryIntegrity(root),
		/exact-pinned[\s\S]*topological publish order/
	);
});
