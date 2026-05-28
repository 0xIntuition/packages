#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const tempRoot = mkdtempSync(join(tmpdir(), 'intuition-packages-smoke-'));
const packageOrder = [
	'deployments',
	'curves',
	'ids',
	'classifications',
	'predicates',
	'primitives',
	'protocol',
	'periphery',
	'react',
];
const tarballPaths = [];

function run(command, args, cwd = tempRoot) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		env: {
			...process.env,
			NPM_CONFIG_CACHE: resolve(tempRoot, '.npm-cache'),
		},
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

function packageRoot(packageName) {
	return resolve(repoRoot, 'packages', packageName);
}

function readTarballPackageJson(tarballPath) {
	return JSON.parse(run('tar', ['-xOf', tarballPath, 'package/package.json']));
}

function assertNoWorkspaceProtocol(packageJson, packageName) {
	assert.doesNotMatch(
		JSON.stringify(packageJson),
		/workspace:/,
		`${packageName} tarball package.json must not contain workspace protocol specs.`
	);
}

try {
	for (const packageName of packageOrder) {
		const cwd = packageRoot(packageName);
		run('bun', ['run', 'build'], cwd);
		const dryRun = JSON.parse(
			run(
				'node',
				[
					'../../scripts/pack-release.mjs',
					'--dry-run',
					'--json',
					'--dist-entrypoints',
					'--rewrite-workspace-deps',
				],
				cwd
			)
		);
		const packedFiles = new Set(dryRun[0]?.files?.map((entry) => entry.path));
		for (const filePath of ['dist/index.js', 'dist/index.d.ts', 'README.md']) {
			assert(packedFiles.has(filePath), `${packageName} tarball is missing ${filePath}`);
		}
		for (const filePath of packedFiles) {
			assert(!filePath.startsWith('src/'), `${packageName} tarball leaked source file ${filePath}`);
		}
		const tarballPath = run(
			'node',
			['../../scripts/pack-release.mjs', '--dist-entrypoints', '--rewrite-workspace-deps'],
			cwd
		).trim();
		assert.ok(tarballPath, `${packageName} release pack did not return a tarball path`);
		tarballPaths.push(tarballPath);
		assertNoWorkspaceProtocol(readTarballPackageJson(tarballPath), `@0xintuition/${packageName}`);
	}

	writeFileSync(
		resolve(tempRoot, 'package.json'),
		JSON.stringify({ name: 'intuition-packages-smoke', private: true, type: 'module' }, null, 2)
	);

	run('npm', [
		'install',
		'--ignore-scripts',
		'--no-package-lock',
		'viem@2.31.4',
		'@tanstack/react-query@5.90.2',
		'react@19.1.0',
		'react-dom@19.1.0',
		'wagmi@2.15.4',
		...tarballPaths,
	]);

	const importProgram = `
		const results = {};
		const deployments = await import('@0xintuition/deployments');
		results.multiVault = deployments.getMultiVaultAddressFromChainId(deployments.INTUITION_MAINNET_CHAIN_ID);
		const ids = await import('@0xintuition/ids');
		results.oauth = ids.serializeOAuthAtomData({ provider: 'google', providerAccountId: '123' });
		const classifications = await import('@0xintuition/classifications');
		results.classification = classifications.getClassification('ethereum-account')?.type;
		const predicates = await import('@0xintuition/predicates');
		results.predicate = predicates.getPredicateRecord('follow')?.name;
		const primitives = await import('@0xintuition/primitives');
		const account = primitives.buildEthereumAccount({ address: '0x0000000000000000000000000000000000000001' });
		results.atom = account.success ? account.value.id : undefined;
		const curves = await import('@0xintuition/curves');
		results.curve = typeof curves.createLinearCurve;
		const protocol = await import('@0xintuition/protocol');
		results.protocol = Array.isArray(protocol.MultiVaultAbi);
		results.hasProtocolDeployments = 'intuitionDeployments' in protocol;
		const periphery = await import('@0xintuition/periphery');
		results.periphery = periphery.getTrustSwapAndBridgeRouterAddressFromChainId(8453);
		const react = await import('@0xintuition/react');
		results.react = typeof react.IntuitionProvider;
		console.log(JSON.stringify(results));
	`;

	const nodeResult = JSON.parse(run('node', ['--input-type=module', '-e', importProgram]).trim());
	assert.match(nodeResult.multiVault, /^0x[0-9a-f]{40}$/i);
	assert.match(nodeResult.oauth, /schema\.intuition\.systems\/v1\/oauth-atom\.jsonld/);
	assert.equal(nodeResult.classification, 'EthereumAccount');
	assert.equal(nodeResult.predicate, 'follow');
	assert.match(nodeResult.atom, /^0x[0-9a-f]{64}$/i);
	assert.equal(nodeResult.curve, 'function');
	assert.equal(nodeResult.protocol, true);
	assert.equal(nodeResult.hasProtocolDeployments, false);
	assert.match(nodeResult.periphery, /^0x[0-9a-f]{40}$/i);
	assert.equal(nodeResult.react, 'function');

	const bunResult = JSON.parse(run('bun', ['--eval', importProgram]).trim());
	assert.equal(bunResult.hasProtocolDeployments, false);
	assert.equal(bunResult.react, 'function');

	console.log('Clean-room tarball smoke passed for all public alpha packages.');
} finally {
	rmSync(tempRoot, { force: true, recursive: true });
	for (const tarballPath of tarballPaths) {
		rmSync(tarballPath, { force: true });
	}
}
