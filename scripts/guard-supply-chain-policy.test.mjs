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
const EXCEPTION_VERSION = '1.1.0-alpha.1';

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

	// Keep fixtures independent of whether the live tree has a temporary exception.
	const bunfigPath = path.join(fixtureRoot, 'bunfig.toml');
	fs.writeFileSync(
		bunfigPath,
		fs.readFileSync(bunfigPath, 'utf8').replace(/^minimumReleaseAgeExcludes[^\n]*\n/gm, '')
	);
	fs.writeFileSync(
		path.join(fixtureRoot, 'supply-chain-exceptions.json'),
		JSON.stringify({ schemaVersion: 1, minimumReleaseAge: [] })
	);
	return fixtureRoot;
}

/**
 * Reads the registry integrity the lockfile records for the exception package so a
 * synthetic approval record binds to the real lock entry.
 */
function lockedIntegrity(fixtureRoot) {
	const lock = fs.readFileSync(path.join(fixtureRoot, 'bun.lock'), 'utf8');
	const entry = lock.match(
		new RegExp(
			`"${EXCEPTION_PACKAGE.replace('/', '\\/')}@${EXCEPTION_VERSION}"[^\\n]*?"(sha512-[^"]+)"`
		)
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

test('accepts the policy with no active exception', (t) => {
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
	manifest.devDependencies[EXCEPTION_PACKAGE] = '1.1.0-alpha.2';
	fs.writeFileSync(packagePath, `${JSON.stringify(manifest, null, '\t')}\n`);

	const result = runGuard(fixtureRoot);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /must pin approved exception version 1\.1\.0-alpha\.1/);
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

const representationProbes = [
	[
		'quoted excludes without approval',
		(s) => `${s}"minimumReleaseAgeExcludes" = ["typescript"]\n`,
		'policy key "minimumReleaseAgeExcludes" must be bare inside [install]',
	],
	[
		'dotted excludes above install',
		(s) => `install.minimumReleaseAgeExcludes = ["typescript"]\n${s}`,
		'policy key install.minimumReleaseAgeExcludes must be bare inside [install]',
	],
	[
		'literal quoted age',
		(s) => s.replace('minimumReleaseAge = 1209600', "'minimumReleaseAge' = 0"),
		"policy key 'minimumReleaseAge' must be bare inside [install]",
	],
	[
		'quoted install header',
		(s) => s.replace('[install]', '["install"]'),
		'install table must use bare [install]; found ["install"]',
	],
	[
		'age under run table',
		(s) => `${s.replace('minimumReleaseAge = 1209600', '')}\n[run]\nminimumReleaseAge = 1209600\n`,
		'policy key minimumReleaseAge must be bare inside [install]',
	],
	[
		'inline install table',
		(s) =>
			`install = { minimumReleaseAge = 0 }\n${s.replace('[install]', '').replace('minimumReleaseAge = 1209600', '')}`,
		'install table must use bare [install]; found assignment install',
	],
	['duplicate install header', (s) => `${s}\n[install]\n`, 'duplicate [install] header'],
	[
		'underscored age',
		(s) => s.replace('1209600', '1_209_600'),
		'minimumReleaseAge must be plain decimal digits; found 1_209_600',
	],
	[
		'multiline excludes with approval',
		(s) => s.replace(`["${EXCEPTION_PACKAGE}"]`, `[\n"${EXCEPTION_PACKAGE}"\n]`),
		'minimumReleaseAgeExcludes must be a single-line string array',
		true,
	],
	[
		'literal install header',
		(s) => s.replace('[install]', "['install']"),
		"install table must use bare [install]; found ['install']",
	],
	[
		'array install header',
		(s) => s.replace('[install]', '[[install]]'),
		'install table must use bare [install]; found [[install]]',
	],
	[
		'quoted dotted install header',
		(s) => `${s}\n["install".scopes]\nexample = "value"\n`,
		'install table must use bare [install]; found ["install".scopes]',
	],
	[
		'quoted dotted policy segment',
		(s) => `install."minimumReleaseAgeExcludes" = ["typescript"]\n${s}`,
		'policy key install."minimumReleaseAgeExcludes" must be bare inside [install]',
	],
	[
		'policy inside install subtable',
		(s) => `${s}\n[install.cache]\nminimumReleaseAge = 0\n`,
		'policy key minimumReleaseAge must be bare inside [install]',
	],
	[
		'escaped policy key',
		(s) => `${s}"minimumReleaseAge\\u0045xcludes" = ["typescript"]\n`,
		'policy key "minimumReleaseAge\\u0045xcludes" must be bare inside [install]',
	],
	[
		'policy table header',
		(s) => `${s}\n[install.minimumReleaseAgeExcludes]\n`,
		'policy table [install.minimumReleaseAgeExcludes] must use a bare assignment inside [install]',
	],
	['duplicate age', (s) => `${s}minimumReleaseAge = 0\n`, 'duplicate policy key minimumReleaseAge'],
	[
		'ambiguous multiline string',
		(s) => `${s}description = """\n`,
		'multiline string value for description',
	],
	[
		'non-string excludes',
		(s) => `${s}minimumReleaseAgeExcludes = [42]\n`,
		'minimumReleaseAgeExcludes must be a single-line string array',
	],
	...[
		'"1209600"',
		'+1209600',
		'-1209600',
		'0x127500',
		'0o4472400',
		'0b100100111010100000000',
		'1209600oops',
	].map((value) => [
		`noncanonical age ${value}`,
		(s) => s.replace('1209600', value),
		`minimumReleaseAge must be plain decimal digits; found ${value}`,
	]),
];

for (const [name, change, diagnostic, activeException] of representationProbes) {
	test(`rejects unsupported bunfig representation: ${name}`, (t) => {
		const fixtureRoot = createPolicyFixture();
		t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
		if (activeException) installActiveException(fixtureRoot);
		const bunfigPath = path.join(fixtureRoot, 'bunfig.toml');
		fs.writeFileSync(bunfigPath, change(fs.readFileSync(bunfigPath, 'utf8')));
		const result = runGuard(fixtureRoot);
		assert.notEqual(result.status, 0);
		assert.ok(
			result.stderr.includes(`unsupported bunfig representation: ${diagnostic}`),
			result.stderr
		);
		t.diagnostic(
			result.stderr
				.split('\n')
				.find((line) => line.includes(`unsupported bunfig representation: ${diagnostic}`))
		);
		assert.doesNotMatch(
			result.stderr,
			/missing minimumReleaseAge|must exactly match supply-chain-exceptions/
		);
	});
}

for (const [name, change] of [
	['install scopes', (s) => `${s}\n[install.scopes]\nexample = "harmless"\n`],
	['age trailing comment', (s) => s.replace('1209600', '1209600 # note')],
	['header whitespace and comment', (s) => s.replace('[install]', '[ install ] # note')],
	['hash inside basic string', (s) => `${s}\n[run]\nshell = "value#still-a-string" # note\n`],
	[
		'F1 multiline preload reproduction',
		() => '[install]\nminimumReleaseAge = 1209600\n\n[test]\npreload = [\n  "./setup.ts",\n]\n',
	],
	[
		'F1 multiline cache reproduction',
		() => '[install]\nminimumReleaseAge = 1209600\n\n[install.cache]\ndir = """\n.bun-cache"""\n',
	],
	[
		'F1 nested array and comments',
		(s) =>
			`${s}\n[test]\npreload = [\n  # [install] and minimumReleaseAge = 0 are comment content\n  ["./setup.ts",], # nested array\n]\n`,
	],
	[
		'F1 literal multiline string with basic delimiters',
		(s) => `${s}\n[install.cache]\ndir = '''\n.cache"""dir\n'''\n`,
	],
	[
		'F1 policy-looking basic string content',
		(s) =>
			`${s}\n[install.cache]\ndir = """\nminimumReleaseAge = 0\n[install]\n# content, not a comment\n"""\n`,
	],
	[
		'F2 triple literal quotes in preload',
		() => `[install]\nminimumReleaseAge = 1209600\n\n[test]\npreload = ["./has'''quotes.ts"]\n`,
	],
	[
		'F2 triple literal quotes in cache',
		() => `[install]\nminimumReleaseAge = 1209600\n\n[install.cache]\ndir = ".cache'''dir"\n`,
	],
	[
		'F2 triple basic quotes in literal preload',
		() => `[install]\nminimumReleaseAge = 1209600\n\n[test]\npreload = ['./has"""quotes.ts']\n`,
	],
	['F2 escaped quote and hash', (s) => `${s}\n[test]\npreload = ["a\\"#b"] # note\n`],
	['F2 hash in literal string', (s) => `${s}\n[install.cache]\ndir = 'a#b' # note\n`],
	[
		'multiline basic line-ending backslash',
		(s) => `${s}\n[install.cache]\ndir = """\n.cache\\\n  continued\\\n\n  dir""" # note\n`,
	],
	[
		'multiline array strings and closing quote runs',
		(s) =>
			`${s}\n[test]\npreload = [\n  """a\\"#b\nminimumReleaseAge = 0"""",\n  '''c\n[install]''''',\n]\n[install.cache]\ndir = "cache"\n`,
	],
	[
		'canonical install after root multiline value',
		(s) => `description = """\n[install]\nminimumReleaseAge = 0\n"""\n${s}`,
	],
]) {
	test(`accepts canonical bunfig with ${name}`, (t) => {
		const fixtureRoot = createPolicyFixture();
		t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
		const bunfigPath = path.join(fixtureRoot, 'bunfig.toml');
		fs.writeFileSync(bunfigPath, change(fs.readFileSync(bunfigPath, 'utf8')));
		const result = runGuard(fixtureRoot);
		assert.equal(result.status, 0, result.stderr);
	});
}

for (const [name, suffix, diagnostic] of [
	['duplicate install header', '[install]\n', 'duplicate [install] header'],
	[
		'policy in cache table',
		'[install.cache]\nminimumReleaseAge = 0\n',
		'policy key minimumReleaseAge must be bare inside [install]',
	],
]) {
	test(`rejects ${name} after an opaque multiline value`, (t) => {
		const fixtureRoot = createPolicyFixture();
		t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
		const bunfigPath = path.join(fixtureRoot, 'bunfig.toml');
		fs.appendFileSync(bunfigPath, `\n[test]\npreload = [\n  "./setup.ts",\n]\n${suffix}`);
		const result = runGuard(fixtureRoot);
		assert.notEqual(result.status, 0);
		assert.ok(
			result.stderr.includes(`unsupported bunfig representation: ${diagnostic}`),
			result.stderr
		);
		assert.equal(
			result.stderr.split('\n').filter((line) => line.startsWith('- ')).length,
			1,
			result.stderr
		);
	});
}

test('frozen install remains reproducible without an exception', () => {
	const lockfilePath = path.join(repoRoot, 'bun.lock');
	const before = fs.readFileSync(lockfilePath, 'utf8');

	execFileSync('bun', ['install', '--frozen-lockfile'], {
		cwd: repoRoot,
		stdio: 'pipe',
	});

	assert.equal(
		fs.readFileSync(lockfilePath, 'utf8'),
		before,
		'frozen install must leave bun.lock unchanged'
	);
});
