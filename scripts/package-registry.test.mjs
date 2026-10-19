import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	assertPublicTarballFiles,
	assertRegistryIntegrity,
	PACKAGES,
} from './package-registry.mjs';

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

test('rejects agent instructions and hidden working notes in actual tarball paths', () => {
	for (const file of [
		'AGENTS.md',
		'docs/CLAUDE.md',
		'docs/agents.local.md',
		'dist/.codex/config.json',
		'.planning/release.md',
		'.local/agent-notes/session.md',
		'docs/SKILL.md',
	]) {
		assert.throws(
			() => assertPublicTarballFiles(['dist/index.js', file], '@example/sdk'),
			/internal agent files/
		);
	}
});

test('keeps public agent-facing APIs and contributor documentation', () => {
	assert.doesNotThrow(() =>
		assertPublicTarballFiles(
			['README.md', 'docs/migration.md', 'dist/plans/index.js', 'dist/agents.js'],
			'@example/sdk'
		)
	);
});

test('direct publication rejects instructions nested under an allowed docs directory', (t) => {
	const root = mkdtempSync(join(tmpdir(), 'intuition-public-files-'));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	mkdirSync(join(root, 'dist'));
	mkdirSync(join(root, 'docs'));
	writeFileSync(
		join(root, 'package.json'),
		JSON.stringify({
			name: '@example/public-file-check',
			version: '1.0.0',
			private: false,
			type: 'module',
			license: 'MIT',
			main: './dist/index.js',
			types: './dist/index.d.ts',
			files: ['dist', 'README.md', 'LICENSE', 'docs'],
			exports: { '.': './dist/index.js' },
		})
	);
	for (const file of [
		'dist/index.js',
		'dist/index.d.ts',
		'README.md',
		'LICENSE',
		'docs/AGENTS.md',
	]) {
		writeFileSync(join(root, file), '');
	}
	const result = spawnSync(
		process.execPath,
		[fileURLToPath(new URL('./guard-direct-publish.mjs', import.meta.url))],
		{
			cwd: root,
			encoding: 'utf8',
		}
	);
	assert.equal(result.status, 1, result.stderr);
	assert.match(result.stderr, /internal agent files in npm tarball: docs\/AGENTS.md/);
});
