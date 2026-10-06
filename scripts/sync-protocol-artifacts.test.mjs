import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const scriptPath = resolve(repoRoot, 'scripts/sync-protocol-artifacts.mjs');
const source = readFileSync(scriptPath, 'utf8');
const provenancePath = resolve(
	repoRoot,
	'packages/protocol/src/contracts/contracts-v2-provenance.ts'
);
const lockPath = resolve(repoRoot, 'bun.lock');
const installedRoot = resolve(repoRoot, 'node_modules/@0xintuition/contracts-v2');
const manifest = JSON.parse(readFileSync(resolve(installedRoot, 'package.json'), 'utf8'));

// Evaluate the actual script with virtual file overlays: no fixture directories,
// environment mutation, network requests, or writes to generated source files.
async function runScript({ args = [], files = new Map(), env = {}, writes = new Map() } = {}) {
	const messages = [];
	const context = createContext({
		process: { argv: ['node', scriptPath, ...args], env },
		console: { log: (message) => messages.push(message) },
		URL,
	});
	const module = new SourceTextModule(source, {
		context,
		initializeImportMeta(meta) {
			meta.url = pathToFileURL(scriptPath).href;
		},
		importModuleDynamically: (specifier) => import(specifier),
	});
	await module.link(async (specifier) => {
		const namespace = { ...(await import(specifier)) };
		if (specifier === 'node:fs') {
			namespace.readFileSync = (path, ...rest) =>
				files.has(String(path)) ? files.get(String(path)) : readFileSync(path, ...rest);
			namespace.writeFileSync = (path, content) => writes.set(String(path), content);
		}
		return new SyntheticModule(
			Object.keys(namespace),
			function () {
				for (const [name, value] of Object.entries(namespace)) this.setExport(name, value);
			},
			{ context }
		);
	});
	await module.evaluate();
	return { writes, messages };
}

function record(writes) {
	const content = writes.get(provenancePath);
	assert.ok(content, 'sync must write provenance');
	return content;
}

test('registry provenance uses the locked integrity and leaves all four artifacts unchanged', async () => {
	const { writes, messages } = await runScript();
	assert.equal(writes.size, 1);
	const content = record(writes);
	const lockedIntegrity = readFileSync(lockPath, 'utf8').match(
		/"@0xintuition\/contracts-v2": \[.*"(sha512-[^"]+)"\]/
	)[1];
	assert.ok(content.includes(lockedIntegrity));
	assert.match(content, /source: 'registry'/);
	assert.equal(messages.filter((message) => /byte-identical/.test(message)).length, 4);
});

test('lockfile integrity drift fails the artifact check', async () => {
	const lock = readFileSync(lockPath, 'utf8').replace('sha512-vt9GFaF', 'sha512-changed');
	await assert.rejects(
		runScript({ args: ['--check'], files: new Map([[lockPath, lock]]) }),
		/Protocol artifacts are stale: contracts-v2-provenance.ts/
	);
});

test('missing exact lock entry fails clearly', async () => {
	const lock = readFileSync(lockPath, 'utf8').replaceAll(
		'@0xintuition/contracts-v2@1.1.0-alpha.0',
		'@0xintuition/contracts-v2@9.9.9'
	);
	await assert.rejects(
		runScript({ files: new Map([[lockPath, lock]]) }),
		/Missing lockfile integrity for @0xintuition\/contracts-v2@1.1.0-alpha.0/
	);
});

test('supplied directory records its own version and no implied registry integrity', async () => {
	const files = new Map([
		[
			resolve(installedRoot, 'package.json'),
			JSON.stringify({ ...manifest, version: '9.9.9-supplied' }),
		],
	]);
	const result = await runScript({ args: [`--source=${installedRoot}`], files });
	assert.equal(result.writes.size, 1);
	assert.match(record(result.writes), /source: 'supplied'/);
	assert.match(record(result.writes), /version: '9.9.9-supplied'/);
	assert.match(record(result.writes), /integrity: null/);
});

test('environment override is supplied and only explicit integrity is recorded', async () => {
	const result = await runScript({
		args: ['--integrity=sha512-YWJjZA=='],
		env: { INTUITION_CONTRACTS_V2_ROOT: installedRoot },
	});
	assert.match(record(result.writes), /source: 'supplied'/);
	assert.match(record(result.writes), /integrity: 'sha512-YWJjZA=='/);
});

test('supplied integrity requires the sha512 prefix', async () => {
	await assert.rejects(
		runScript({ args: [`--source=${installedRoot}`, '--integrity=sha256-YWJjZA=='] }),
		/Supplied integrity must be a sha512-/
	);
});

test('check rejects committed supplied provenance even with otherwise matching artifacts', async () => {
	const supplied = readFileSync(provenancePath, 'utf8').replace(
		"source: 'registry'",
		"source: 'supplied'"
	);
	await assert.rejects(
		runScript({ args: ['--check'], files: new Map([[provenancePath, supplied]]) }),
		/Committed protocol provenance must describe the registry artifact/
	);
});

test('artifact drift fails before any file write', async () => {
	const writes = new Map();
	const driftPath = resolve(repoRoot, 'packages/protocol/src/contracts/MultiVault-abi.ts');
	await assert.rejects(
		runScript({ writes, files: new Map([[driftPath, '// different artifact\n']]) }),
		/Generated ABI\/bytecode would change: MultiVault-abi.ts/
	);
	assert.equal(writes.size, 0);
});
