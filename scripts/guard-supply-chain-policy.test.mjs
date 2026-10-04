import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MINIMUM_RELEASE_AGE_MS = 1_209_600 * 1000;
const EXCEPTION_PACKAGE = '@0xintuition/contracts-v2';
const EXCEPTION_VERSION = '1.1.0-alpha.0';

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

/**
 * Reads the registry integrity the lockfile records for the exception package so a
 * synthetic approval record binds to the real lock entry.
 */
function lockedIntegrity(fixtureRoot) {
	const lock = fs.readFileSync(path.join(fixtureRoot, 'bun.lock'), 'utf8');
	const entry = lock.match(
		new RegExp(`"${EXCEPTION_PACKAGE.replace('/', '\\/')}@${EXCEPTION_VERSION}"[^\\n]*?"(sha512-[^"]+)"`)
	);
	assert.ok(entry, `lockfile must record ${EXCEPTION_PACKAGE}@${EXCEPTION_VERSION}`);
	return entry[1];
}

/**
 * Installs a still-valid, exact-version approval record for the exception package
 * into the fixture: the manifest entry plus the matching bunfig exclusion. Tests that
 * exercise drift detection start from this state, independent of whether the live
 * repository currently carries any exception.
 */
function installActiveException(fixtureRoot) {
	const publishedAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const removeAfter = new Date(publishedAt.getTime() + MINIMUM_RELEASE_AGE_MS);

	fs.writeFileSync(
		path.join(fixtureRoot, 'supply-chain-exceptions.json'),
		`${JSON.stringify(
			{
				schemaVersion: 1,
				minimumReleaseAge: [
					{
						package: EXCEPTION_PACKAGE,
						version: EXCEPTION_VERSION,
						integrity: lockedIntegrity(fixtureRoot),
						publishedAt: publishedAt.toISOString(),
						removeAfter: removeAfter.toISOString(),
						reason: 'Test fixture: exact-version approval record.',
					},
				],
			},
			null,
			'\t'
		)}\n`
	);

	const bunfigPath = path.join(fixtureRoot, 'bunfig.toml');
	fs.writeFileSync(
		bunfigPath,
		`${fs.readFileSync(bunfigPath, 'utf8')}minimumReleaseAgeExcludes = ["${EXCEPTION_PACKAGE}"]\n`
	);
}

function runGuard(fixtureRoot) {
	return spawnSync(process.execPath, ['scripts/guard-supply-chain-policy.mjs'], {
		cwd: fixtureRoot,
		encoding: 'utf8',
	});
}

test('accepts the live policy with no active exception', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

	const result = runGuard(fixtureRoot);
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Supply-chain policy guard passed/);
});

test('accepts an exact, still-valid approval record', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
	installActiveException(fixtureRoot);

	const result = runGuard(fixtureRoot);
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Supply-chain policy guard passed/);
});

test('rejects an expired approval record', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
	installActiveException(fixtureRoot);

	const policyPath = path.join(fixtureRoot, 'supply-chain-exceptions.json');
	const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
	const publishedAt = new Date(Date.now() - 2 * MINIMUM_RELEASE_AGE_MS);
	policy.minimumReleaseAge[0].publishedAt = publishedAt.toISOString();
	policy.minimumReleaseAge[0].removeAfter = new Date(
		publishedAt.getTime() + MINIMUM_RELEASE_AGE_MS
	).toISOString();
	fs.writeFileSync(policyPath, `${JSON.stringify(policy, null, '\t')}\n`);

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /is now old enough; remove its release-age exception/);
});

test('rejects a package-name exclusion without an approval record', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

	const bunfigPath = path.join(fixtureRoot, 'bunfig.toml');
	fs.writeFileSync(
		bunfigPath,
		`${fs.readFileSync(bunfigPath, 'utf8')}minimumReleaseAgeExcludes = ["typescript"]\n`
	);

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /must exactly match supply-chain-exceptions\.json/);
});

test('rejects a second package-name exclusion beside an approval record', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
	installActiveException(fixtureRoot);

	const bunfigPath = path.join(fixtureRoot, 'bunfig.toml');
	fs.writeFileSync(
		bunfigPath,
		fs
			.readFileSync(bunfigPath, 'utf8')
			.replace(`["${EXCEPTION_PACKAGE}"]`, `["${EXCEPTION_PACKAGE}", "typescript"]`)
	);

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /must exactly match supply-chain-exceptions\.json/);
});

test('rejects version drift even though Bun excludes by package name', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
	installActiveException(fixtureRoot);

	const packagePath = path.join(fixtureRoot, 'package.json');
	const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	manifest.devDependencies[EXCEPTION_PACKAGE] = '1.1.0-alpha.1';
	fs.writeFileSync(packagePath, `${JSON.stringify(manifest, null, '\t')}\n`);

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /must pin approved exception version 1\.1\.0-alpha\.0/);
});

test('rejects lockfile integrity drift', (t) => {
	const fixtureRoot = createPolicyFixture();
	t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
	installActiveException(fixtureRoot);

	const lockfilePath = path.join(fixtureRoot, 'bun.lock');
	const integrity = lockedIntegrity(fixtureRoot);
	fs.writeFileSync(
		lockfilePath,
		fs.readFileSync(lockfilePath, 'utf8').replace(integrity, 'sha512-invalid')
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

test('frozen install remains reproducible without an exception', () => {
	const lockfilePath = path.join(repoRoot, 'bun.lock');
	const before = fs.readFileSync(lockfilePath, 'utf8');

	execFileSync('bun', ['install', '--frozen-lockfile'], {
		cwd: repoRoot,
		stdio: 'pipe',
	});

	assert.equal(fs.readFileSync(lockfilePath, 'utf8'), before, 'frozen install must leave bun.lock unchanged');
});
