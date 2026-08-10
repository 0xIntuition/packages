#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
	PACKAGES,
	assertRegistryIntegrity,
	packageRootFor,
	requiredTarballFiles,
} from './package-registry.mjs';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const tempRoot = mkdtempSync(join(tmpdir(), 'intuition-packages-smoke-'));
const workspaceManifests = assertRegistryIntegrity(repoRoot);
const tarballPaths = [];
const tarballPackageJsons = new Map();

function run(command, args, cwd = tempRoot) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		env: {
			...process.env,
			NPM_CONFIG_CACHE: resolve(tempRoot, '.npm-cache'),
		},
		maxBuffer: 1024 * 1024 * 100,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

function packageRoot(packageName) {
	return packageRootFor(repoRoot, packageName);
}

function readTarballPackageJson(tarballPath) {
	return JSON.parse(run('tar', ['-xOf', tarballPath, 'package/package.json']));
}

const workspacePackageVersions = new Map(
	[...workspaceManifests.values()].map((manifest) => [manifest.name, manifest.version])
);

function assertNoWorkspaceProtocol(packageJson, packageName) {
	assert.doesNotMatch(
		JSON.stringify(packageJson),
		/workspace:|catalog:/,
		`${packageName} tarball package.json must not contain workspace-only dependency specs.`
	);
}

function assertInternalDependencyVersions(packageJson, packageName) {
	for (const fieldName of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
		'optionalDependencies',
	]) {
		const dependencies = packageJson[fieldName];
		if (!dependencies || typeof dependencies !== 'object') {
			continue;
		}

		for (const [dependencyName, versionRange] of Object.entries(dependencies)) {
			if (!dependencyName.startsWith('@0xintuition/')) {
				continue;
			}

			const expectedVersion =
				tarballPackageJsons.get(dependencyName)?.version ??
				workspacePackageVersions.get(dependencyName);
			assert.equal(
				versionRange,
				expectedVersion,
				`${packageName} ${fieldName}.${dependencyName} must match the packed workspace version.`
			);
		}
	}
}

try {
	for (const { dirName: packageName, kind } of PACKAGES) {
		const cwd = packageRoot(packageName);
		if (kind === 'compiled') {
			run('bun', ['run', 'build'], cwd);
		}
		const dryRun = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--dry-run', '--json'], cwd));
		const packedFiles = new Set(dryRun[0]?.files?.map((entry) => entry.path));
		for (const filePath of requiredTarballFiles(kind)) {
			assert(packedFiles.has(filePath), `${packageName} tarball is missing ${filePath}`);
		}
		for (const filePath of packedFiles) {
			assert(!filePath.startsWith('src/'), `${packageName} tarball leaked source file ${filePath}`);
		}
		const tarballPath = run('bun', ['run', 'pack:release'], cwd)
			.trim()
			.split('\n')
			.at(-1);
		assert.ok(tarballPath, `${packageName} release pack did not return a tarball path`);
		tarballPaths.push(tarballPath);
		const tarballPackageJson = readTarballPackageJson(tarballPath);
		tarballPackageJsons.set(tarballPackageJson.name, tarballPackageJson);
		assertNoWorkspaceProtocol(tarballPackageJson, `@0xintuition/${packageName}`);
		assertInternalDependencyVersions(tarballPackageJson, `@0xintuition/${packageName}`);
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
		results.predicateId = ids.calculatePredicateId('follow', 'Directional subscription or tracking of the object entity');
		results.predicateAtomData = ids.createPredicateAtomData('follow', 'Directional subscription or tracking of the object entity');
		const schemaOrg = await import('@0xintuition/schema-org');
		results.schemaOrgBook = schemaOrg.getType('Book')?.name;
		results.schemaOrgBookNameOrigin = schemaOrg.getPropertiesFor('Book').find((property) => property.name === 'name')?.originType;
		results.schemaOrgBookAuthorOrigin = schemaOrg.getPropertiesFor('Book').find((property) => property.name === 'author')?.originType;
		const schemaOrgBook = await import('@0xintuition/schema-org/Book');
		results.schemaOrgBookSubpath = schemaOrgBook.schemaOrgBook.name;
		const classifications = await import('@0xintuition/classifications');
		results.classification = classifications.getClassification('ethereum-account')?.type;
		const ethereumAccountClassification = await import('@0xintuition/classifications/ethereum-account');
		results.classificationSubpath = ethereumAccountClassification.ethereumAccount.type;
		const musicRecordingCreation = await import('@0xintuition/classifications/creation/music-recording');
		results.musicRecordingCreationProfile = musicRecordingCreation.musicRecordingCreationProfile.classification.slug;
		results.musicRecordingCreationRelationshipCount = musicRecordingCreation.musicRecordingCreationProfile.relationships.length;
		const creationProfiles = await import('@0xintuition/classifications/creation');
		results.creationProfileCount = creationProfiles.CREATION_PROFILES.length;
		results.creationProfileIncludesMusicRecording = creationProfiles.CREATION_PROFILE_SLUGS.includes('music-recording');
		const predicates = await import('@0xintuition/predicates');
		results.predicate = predicates.getPredicateRecord('follow')?.name;
		results.followId = predicates.getPredicateId('follow');
		results.launchHasFollow = predicates.LAUNCH_PREDICATE_KEYS.includes('follow');
		results.followAtomData = predicates.createPredicateAtomData('follow', 'Directional subscription or tracking of the object entity');
		const followPredicate = await import('@0xintuition/predicates/follow');
		results.followSubpath = followPredicate.follow.name;
		results.followSubpathId = followPredicate.followId;
		results.followSubpathAtomData = followPredicate.followAtomData;
		const primitives = await import('@0xintuition/primitives');
		const account = primitives.buildEthereumAccount({ address: '0x0000000000000000000000000000000000000001' });
		results.atom = account.success ? account.value.id : undefined;
		const primitiveAtom = await import('@0xintuition/primitives/atom');
		const primitivePredicate = await import('@0xintuition/primitives/predicate');
		const primitiveTriple = await import('@0xintuition/primitives/triple');
		const primitiveDiscover = await import('@0xintuition/primitives/discover');
		const primitiveValidate = await import('@0xintuition/primitives/validate');
		const primitiveTypes = await import('@0xintuition/primitives/types');
		results.primitiveAtomSubpath = typeof primitiveAtom.buildEthereumAccount;
		results.primitivePredicateSubpath = typeof primitivePredicate.getPredicateInfo;
		results.primitiveTripleSubpath = typeof primitiveTriple.buildTripleByName;
		results.primitiveDiscoverSubpath = typeof primitiveDiscover.listClassifications;
		results.primitiveValidateSubpath = typeof primitiveValidate.validateAtom;
		results.primitiveTypesSubpath = primitiveTypes && typeof primitiveTypes === 'object';
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
	assert.match(nodeResult.predicateId, /^0x[0-9a-f]{64}$/i);
	assert.match(nodeResult.predicateAtomData, /"@type":"DefinedTerm"/);
	assert.equal(nodeResult.schemaOrgBook, 'Book');
	assert.equal(nodeResult.schemaOrgBookNameOrigin, 'Thing');
	assert.equal(nodeResult.schemaOrgBookAuthorOrigin, 'CreativeWork');
	assert.equal(nodeResult.schemaOrgBookSubpath, 'Book');
	assert.equal(nodeResult.classification, 'EthereumAccount');
	assert.equal(nodeResult.classificationSubpath, 'EthereumAccount');
	assert.equal(nodeResult.musicRecordingCreationProfile, 'music-recording');
	assert.equal(nodeResult.musicRecordingCreationRelationshipCount, 5);
	assert.equal(nodeResult.creationProfileCount, 37);
	assert.equal(nodeResult.creationProfileIncludesMusicRecording, true);
	assert.equal(nodeResult.predicate, 'follow');
	assert.match(nodeResult.followId, /^0x[0-9a-f]{64}$/i);
	assert.equal(nodeResult.launchHasFollow, true);
	assert.match(nodeResult.followAtomData, /"@type":"DefinedTerm"/);
	assert.equal(nodeResult.followSubpath, 'follow');
	assert.match(nodeResult.followSubpathId, /^0x[0-9a-f]{64}$/i);
	assert.match(nodeResult.followSubpathAtomData, /"@type":"DefinedTerm"/);
	assert.match(nodeResult.atom, /^0x[0-9a-f]{64}$/i);
	assert.equal(nodeResult.primitiveAtomSubpath, 'function');
	assert.equal(nodeResult.primitivePredicateSubpath, 'function');
	assert.equal(nodeResult.primitiveTripleSubpath, 'function');
	assert.equal(nodeResult.primitiveDiscoverSubpath, 'function');
	assert.equal(nodeResult.primitiveValidateSubpath, 'function');
	assert.equal(nodeResult.primitiveTypesSubpath, true);
	assert.equal(nodeResult.curve, 'function');
	assert.equal(nodeResult.protocol, true);
	assert.equal(nodeResult.hasProtocolDeployments, false);
	assert.match(nodeResult.periphery, /^0x[0-9a-f]{40}$/i);
	assert.equal(nodeResult.react, 'function');

	const bunResult = JSON.parse(run('bun', ['--eval', importProgram]).trim());
	assert.equal(bunResult.musicRecordingCreationProfile, 'music-recording');
	assert.equal(bunResult.creationProfileIncludesMusicRecording, true);
	assert.equal(bunResult.followSubpath, 'follow');
	assert.equal(bunResult.primitiveAtomSubpath, 'function');
	assert.equal(bunResult.hasProtocolDeployments, false);
	assert.equal(bunResult.react, 'function');

	console.log('Clean-room tarball smoke passed for all public alpha packages.');
} finally {
	rmSync(tempRoot, { force: true, recursive: true });
	for (const tarballPath of tarballPaths) {
		rmSync(tarballPath, { force: true });
	}
}
