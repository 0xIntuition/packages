import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function createPolicyFixture() {
	const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'intuition-supply-chain-'));
	fs.mkdirSync(path.join(fixtureRoot, 'scripts'));

	for (const relativePath of [
		'.nvmrc',
		'bun.lock',
		'bunfig.toml',
		'package.json',
		'supply-chain-exceptions.json',
		'scripts/enforce-bun-install.mjs',
		'scripts/guard-supply-chain-policy.mjs',
	]) {
		fs.copyFileSync(path.join(repoRoot, relativePath), path.join(fixtureRoot, relativePath));
	}

	return fixtureRoot;
}

function runGuard(fixtureRoot) {
	return spawnSync(process.execPath, ['scripts/guard-supply-chain-policy.mjs'], {
		cwd: fixtureRoot,
		encoding: 'utf8',
	});
}

test('accepts the approved exact contracts-v2 exception', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

	const result = runGuard(fixtureRoot);
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Supply-chain policy guard passed/);
});

test('rejects a second package-name exclusion without an approval record', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

	const bunfigPath = path.join(fixtureRoot, 'bunfig.toml');
	fs.writeFileSync(
		bunfigPath,
		fs
			.readFileSync(bunfigPath, 'utf8')
			.replace('["@0xintuition/contracts-v2"]', '["@0xintuition/contracts-v2", "typescript"]')
	);

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /must exactly match supply-chain-exceptions\.json/);
});

test('rejects version drift even though Bun excludes by package name', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

	const packagePath = path.join(fixtureRoot, 'package.json');
	const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	manifest.devDependencies['@0xintuition/contracts-v2'] = '1.1.0-alpha.1';
	fs.writeFileSync(packagePath, `${JSON.stringify(manifest, null, '\t')}\n`);

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /must pin approved exception version 1\.1\.0-alpha\.0/);
});

test('rejects lockfile integrity drift', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

	const lockfilePath = path.join(fixtureRoot, 'bun.lock');
	fs.writeFileSync(
		lockfilePath,
		fs.readFileSync(lockfilePath, 'utf8').replace('sha512-vt9GFaF', 'sha512-invalid')
	);

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /lock entry must match approved registry integrity/);
});

test('reports malformed exception policy without crashing', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

	fs.writeFileSync(path.join(fixtureRoot, 'supply-chain-exceptions.json'), '{not-json');

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /must contain valid JSON/);
	assert.doesNotMatch(result.stderr, /SyntaxError/);
});

test('frozen install remains reproducible with the approved exception', () => {
	execFileSync('bun', ['install', '--frozen-lockfile'], {
		cwd: repoRoot,
		stdio: 'pipe',
	});
});
