#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	assertRegistryIntegrity,
	PACKAGES,
	packageRootFor,
	requiredTarballFiles,
} from './package-registry.mjs';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
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
		const tarballPath = run('bun', ['run', 'pack:release'], cwd).trim().split('\n').at(-1);
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
		'typescript@5.9.3',
		'@types/react@19.1.10',
		'@tanstack/react-query@5.90.2',
		'react@19.1.0',
		'react-dom@19.1.0',
		'wagmi@2.15.4',
		...tarballPaths,
	]);

	const importProgram = `
		const results = {};
		const { readFileSync } = await import('node:fs');
		const { createRequire } = await import('node:module');
		const require = createRequire(process.cwd() + '/consumer.mjs');
		results.iidSpec = JSON.parse(readFileSync(require.resolve('@0xintuition/iid-spec/conformance/parse.json'), 'utf8')).vectors.length;
		const iid = await import('@0xintuition/iid');
		results.iidValid = iid.inspectIntuitionId('int:isrc:USRC17607839').valid;
		const registry = await import('@0xintuition/iid-registry');
		results.iidClassification = registry.classificationForIid('int:isrc:USRC17607839')?.slug;
		const { buildIidAnchor } = await import('@0xintuition/primitives/anchor');
		const anchor = buildIidAnchor('music-recording', { isrc: 'US-RC1-76-07839' }, { contextUris: ['https://example.com/track'] });
		if (!anchor.success) throw new Error(anchor.errors.join(', '));
		results.anchor = { iid: anchor.value.iid, profile: anchor.value.profile, id: anchor.value.id, dataHex: anchor.value.dataHex };
		const withOtherContext = buildIidAnchor('music-recording', { isrc: 'USRC17607839' }, { contextUris: ['https://example.com/other'] });
		results.contextPreservesId = withOtherContext.success && withOtherContext.value.id === anchor.value.id;
		const deployments = await import('@0xintuition/deployments');
		results.multiVault = deployments.getMultiVaultAddressFromChainId(deployments.INTUITION_MAINNET_CHAIN_ID);
		const deploymentsBytecode = await import('@0xintuition/deployments/bytecode');
		results.deploymentsBytecode = deploymentsBytecode.TrustBytecode;
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
		const iidLadder = await import('@0xintuition/iid-ladder');
		results.iidLadder = iidLadder.projectIdentifierLadder({ strongIdentifiers: { isrc: 'USUM71703861' } });
		results.iidLadderRejectsUnregistered = iidLadder.projectIdentifierLadder({ providerCanonicalId: 'spotify:track:1kcfGBb6kSrGqNIMW7rAlB' });
		results.iidLadderMint = iidLadder.createLadder({ providerLocalHandles: 'mint' }).projectIdentifierLadder({ providerCanonicalId: 'goodreads:book:123' });
		const pipeline = await import('@0xintuition/pipeline-runtime');
		results.pipelineError = pipeline.isPipelineErrorKind('circuit_open');
		for (const subpath of ['bounded-text', 'cache', 'circuit-breaker', 'concurrency', 'errors', 'outcome', 'provider-observer', 'provider-metrics-contract', 'retry-after', 'letterboxd', 'letterboxd-page', 'tmdb', 'testing/prometheus-exposition']) {
			results['pipeline:' + subpath] = Object.keys(await import('@0xintuition/pipeline-runtime/' + subpath)).sort();
		}
		const { forEachBounded } = await import('@0xintuition/pipeline-runtime/concurrency');
		results.pipelineBounded = await forEachBounded([1, 2], async (value) => value * 2, { concurrency: 2 });
		const { CircuitBreaker } = await import('@0xintuition/pipeline-runtime/circuit-breaker');
		results.pipelineCircuit = await new CircuitBreaker({ name: 'smoke', failureThreshold: 1, resetAfterMs: 10 }).execute(async () => 'ok');
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
		results.protocolMultiVault = protocol.getMultiVaultAddressFromChainId(deployments.INTUITION_MAINNET_CHAIN_ID);
		const periphery = await import('@0xintuition/periphery');
		results.periphery = periphery.getMetaNativeSpokeAddressFromChainId(1155);
		try {
			periphery.getTrustSwapAndBridgeRouterAddressFromChainId(8453);
			results.peripheryRouterError = null;
		} catch (error) {
			results.peripheryRouterError = error instanceof Error ? error.message : String(error);
		}
		const sdk = await import('@0xintuition/sdk');
		results.sdk = typeof sdk.multivaultPrepareDepositTx;
		results.sdkMultiVault = sdk.getMultiVaultAddressFromChainId(deployments.INTUITION_MAINNET_CHAIN_ID);
		const sdkApi = await import('@0xintuition/sdk/api');
		const sdkActions = await import('@0xintuition/sdk/actions');
		const sdkProtocol = await import('@0xintuition/sdk/protocol');
		const sdkTrustSwapAndBridgeRouter = await import('@0xintuition/sdk/trust-swap-and-bridge-router');
		const sdkUtils = await import('@0xintuition/sdk/utils');
		results.sdkApiSubpath = typeof sdkApi.createIntuitionApiClient;
		results.sdkActionsSubpath = typeof sdkActions.multivaultPrepareDepositTx;
		results.sdkProtocolSubpath = typeof sdkProtocol.getMultiVaultAddressFromChainId;
		results.sdkTrustSwapAndBridgeRouterSubpath = typeof sdkTrustSwapAndBridgeRouter.sameAddress;
		results.sdkUtilsSubpath = typeof sdkUtils.formatCompactHex;
		const cli = await import('@0xintuition/cli');
		results.cli = typeof cli.buildMultiVaultDepositPlan;
		const react = await import('@0xintuition/react');
		results.react = typeof react.IntuitionProvider;
		// Every runtime export must work from the tarball under both runtimes,
		// including helper subpaths that Core does not happen to import today.
		results.atomRuntimeExports = {};
		for (const name of ['atom-parser', 'atom-classification', 'atom-enrichment']) {
			const specifier = '@0xintuition/' + name;
			const manifest = JSON.parse(readFileSync(require.resolve(specifier + '/package.json'), 'utf8'));
			const subpaths = Object.keys(manifest.exports).filter((key) => key !== './package.json');
			for (const subpath of subpaths) {
				await import(specifier + (subpath === '.' ? '' : subpath.slice(1)));
			}
			results.atomRuntimeExports[name] = subpaths.length;
		}
		const { parseAtom } = await import('@0xintuition/atom-parser/parse');
		results.parsedAtomKind = (await parseAtom('https://example.com', { remoteFetch: false })).kind;
		const { createClientEngine } = await import('@0xintuition/atom-classification/client');
		const { createPlainTextPlugin } = await import('@0xintuition/atom-classification/plugins/plain-text');
		const { createTypeProfilesPlugin } = await import('@0xintuition/atom-classification/plugins/type-profiles');
		const classified = await createClientEngine({ plugins: [createTypeProfilesPlugin(), createPlainTextPlugin()] }).classify({
			input: 'a shared atom runtime', mode: 'client-only', classificationSessionId: 'packed-smoke',
		});
		results.classifiedAtomType = classified.resolved?.classifications[0]?.type;
		const { createEnrichmentEngine } = await import('@0xintuition/atom-enrichment');
		const { createMockPlugin, createMockArtifact, createMockRequest } = await import('@0xintuition/atom-enrichment/testing');
		const enriched = await createEnrichmentEngine({
			plugins: [createMockPlugin({ mockArtifacts: [createMockArtifact()] })],
		}).enrich(createMockRequest());
		results.enrichmentStatus = enriched.status;
		results.enrichedArtifactTypes = enriched.artifacts.map((artifact) => artifact.artifact_type);
		console.log(JSON.stringify(results));
	`;

	const nodeResult = JSON.parse(run('node', ['--input-type=module', '-e', importProgram]).trim());
	assert(nodeResult.iidSpec > 0);
	assert.equal(nodeResult.iidValid, true);
	assert.equal(nodeResult.iidClassification, 'music-recording');
	assert.equal(nodeResult.anchor.iid, 'int:isrc:USRC17607839');
	assert.equal(nodeResult.anchor.profile, 'p0');
	assert.match(nodeResult.anchor.id, /^0x[0-9a-f]{64}$/);
	assert.equal(nodeResult.contextPreservesId, true);
	assert.match(nodeResult.multiVault, /^0x[0-9a-f]{40}$/i);
	assert.match(nodeResult.deploymentsBytecode, /^0x[0-9a-f]+$/i);
	assert.match(nodeResult.oauth, /schema\.intuition\.systems\/v1\/oauth-atom\.jsonld/);
	assert.match(nodeResult.predicateId, /^0x[0-9a-f]{64}$/i);
	assert.match(nodeResult.predicateAtomData, /"@type":"DefinedTerm"/);
	assert.equal(nodeResult.schemaOrgBook, 'Book');
	assert.equal(nodeResult.schemaOrgBookNameOrigin, 'Thing');
	assert.equal(nodeResult.schemaOrgBookAuthorOrigin, 'CreativeWork');
	assert.equal(nodeResult.schemaOrgBookSubpath, 'Book');
	assert.equal(nodeResult.classification, 'EthereumAccount');
	assert.deepEqual(nodeResult.iidLadder, { iid: 'int:isrc:USUM71703861', rung: 'strong' });
	assert.deepEqual(nodeResult.iidLadderRejectsUnregistered, {
		fallback: 'envelope',
		iid: null,
		reason: 'unregistered-provider',
	});
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
	assert.equal(nodeResult.hasProtocolDeployments, true);
	assert.equal(nodeResult.protocolMultiVault, nodeResult.multiVault);
	assert.match(nodeResult.periphery, /^0x[0-9a-f]{40}$/i);
	assert.match(
		nodeResult.peripheryRouterError,
		/Contract TrustSwapAndBridgeRouter not found for chain ID 8453/
	);
	assert.equal(nodeResult.sdk, 'function');
	assert.equal(nodeResult.sdkMultiVault, nodeResult.multiVault);
	assert.equal(nodeResult.sdkApiSubpath, 'function');
	assert.equal(nodeResult.sdkActionsSubpath, 'function');
	assert.equal(nodeResult.sdkProtocolSubpath, 'function');
	assert.equal(nodeResult.sdkTrustSwapAndBridgeRouterSubpath, 'function');
	assert.equal(nodeResult.sdkUtilsSubpath, 'function');
	assert.equal(nodeResult.cli, 'function');
	assert.equal(nodeResult.react, 'function');
	for (const count of Object.values(nodeResult.atomRuntimeExports)) assert(count > 0);
	assert.equal(nodeResult.parsedAtomKind, 'url');
	assert.equal(nodeResult.classifiedAtomType, 'Thing');
	assert.equal(nodeResult.enrichmentStatus, 'success');
	assert.deepEqual(nodeResult.enrichedArtifactTypes, ['opengraph']);

	const bunResult = JSON.parse(run('bun', ['--eval', importProgram]).trim());
	assert.equal(bunResult.musicRecordingCreationProfile, 'music-recording');
	assert.deepEqual(bunResult.iidLadder, { iid: 'int:isrc:USUM71703861', rung: 'strong' });
	assert.equal(bunResult.creationProfileIncludesMusicRecording, true);
	assert.equal(bunResult.followSubpath, 'follow');
	assert.equal(bunResult.primitiveAtomSubpath, 'function');
	assert.equal(bunResult.hasProtocolDeployments, true);
	assert.equal(bunResult.sdk, 'function');
	assert.equal(bunResult.cli, 'function');
	assert.equal(bunResult.react, 'function');

	assert.deepEqual(bunResult.iidLadderMint, { iid: 'int:goodreads:book:123', rung: 'handle' });
	assert.equal(bunResult.pipelineError, true);
	assert.equal(bunResult.pipelineCircuit, 'ok');
	assert.deepEqual(bunResult.pipelineBounded, [
		{ kind: 'success', value: 2 },
		{ kind: 'success', value: 4 },
	]);
	assert.deepEqual(bunResult, nodeResult, 'Node and Bun must agree on every consumer result');

	// Resolve declarations from packed artifacts, without repository aliases or
	// skipLibCheck hiding missing declaration dependencies.
	writeFileSync(
		resolve(tempRoot, 'consumer.ts'),
		`
		import { buildIidAnchor } from '@0xintuition/primitives/anchor';
		import { inspectIntuitionId } from '@0xintuition/iid';
		import { classificationForIid } from '@0xintuition/iid-registry';
		import { createLadder, projectIdentifierLadder } from '@0xintuition/iid-ladder';
		import { forEachBounded } from '@0xintuition/pipeline-runtime/concurrency';
		import { CircuitBreaker, type CircuitSnapshot } from '@0xintuition/pipeline-runtime/circuit-breaker';
		import { type Outcome, runWithSignal, withTimeout } from '@0xintuition/pipeline-runtime/outcome';
		const outcomes: ReadonlyArray<Outcome<number>> = await forEachBounded([1], async (value) => value, { concurrency: 1 });
		const breaker = new CircuitBreaker({ name: 'typed', failureThreshold: 1, resetAfterMs: 10 });
		const snapshot: CircuitSnapshot = breaker.snapshot();
		await breaker.execute(async (signal) => signal.aborted, { signal: new AbortController().signal });
		await runWithSignal(withTimeout(async () => 1, 100));
		createLadder({ providerLocalHandles: 'mint' }).iidForIdentityRung('goodreads:book', '123');
		import { multiVaultCreateAtomsWithUrisEncode, eventParseAtomCreated } from '@0xintuition/protocol';
		import { buildMultiVaultDepositPlan } from '@0xintuition/cli';
		import { multivaultPrepareDepositTx } from '@0xintuition/sdk/actions';
		import { parseAtom } from '@0xintuition/atom-parser/parse';
		import type { ParseResult } from '@0xintuition/atom-parser/types';
		import { createClientEngine } from '@0xintuition/atom-classification/client';
		import { createPlainTextPlugin } from '@0xintuition/atom-classification/plugins/plain-text';
		import { createTypeProfilesPlugin } from '@0xintuition/atom-classification/plugins/type-profiles';
		import { createEnrichmentEngine, type EnrichmentRunResult } from '@0xintuition/atom-enrichment';
		import { createMockPlugin, createMockArtifact, createMockRequest } from '@0xintuition/atom-enrichment/testing';
		const parsed: ParseResult = await parseAtom('hello', { remoteFetch: false });
		await createClientEngine({ plugins: [createTypeProfilesPlugin(), createPlainTextPlugin()] }).classify({
			input: parsed.normalizedInput, mode: 'client-only', classificationSessionId: 'typed-smoke',
		});
		const enriched: EnrichmentRunResult = await createEnrichmentEngine({
			plugins: [createMockPlugin({ mockArtifacts: [createMockArtifact()] })],
		}).enrich(createMockRequest());
		type CliPlan = ReturnType<typeof buildMultiVaultDepositPlan>;
		type SdkPlan = Awaited<ReturnType<typeof multivaultPrepareDepositTx>>;
		import type { Hex } from 'viem';
		const result = buildIidAnchor('music-recording', { isrc: 'USRC17607839' });
		if (result.success) {
			const atomData: Hex = result.value.dataHex;
			multiVaultCreateAtomsWithUrisEncode({ args: ['0x1111111111111111111111111111111111111111', [atomData], [1n], [[]]], value: 1n });
			if (result.value.iid !== null) {
				inspectIntuitionId(result.value.iid);
				classificationForIid(result.value.iid);
			}
		}
		projectIdentifierLadder({ strongIdentifiers: { isrc: 'USRC17607839' } });
		type Events = Awaited<ReturnType<typeof eventParseAtomCreated>>;
	`
	);
	run('node', [
		resolve(tempRoot, 'node_modules/typescript/bin/tsc'),
		'--noEmit',
		'--strict',
		'--target',
		'ES2022',
		'--module',
		'NodeNext',
		'--moduleResolution',
		'NodeNext',
		'consumer.ts',
	]);

	// wagmi's published declarations fail standalone checking under this peer
	// matrix, independently of our packages. Keep the core/IID check above
	// strict; check React consumer calls with the same skipLibCheck setting as
	// this repository, and document that limitation in the release notes.
	writeFileSync(
		resolve(tempRoot, 'consumer-react.ts'),
		`
		import { useTransactionFlow, IntuitionProvider } from '@0xintuition/react';
		import type { Hex, TransactionReceipt } from 'viem';
		const flow = useTransactionFlow({ mutationFn: async (_input: { amount: bigint }): Promise<Hex> => '0x00' });
		const receipt: Promise<TransactionReceipt> = flow.execute({ amount: 1n });
		// @ts-expect-error callers must supply a bigint amount
		flow.execute({ amount: '1' });
		type Provider = typeof IntuitionProvider;
	`
	);
	run('node', [
		resolve(tempRoot, 'node_modules/typescript/bin/tsc'),
		'--noEmit',
		'--strict',
		'--skipLibCheck',
		'--target',
		'ES2022',
		'--module',
		'NodeNext',
		'--moduleResolution',
		'NodeNext',
		'consumer-react.ts',
	]);

	const cliHelp = run('node', [
		resolve(tempRoot, 'node_modules/@0xintuition/cli/dist/bin/intuition.js'),
		'--help',
	]);
	assert.match(cliHelp, /intuition encoders list/);
	const cliCalldata = run('node', [
		resolve(tempRoot, 'node_modules/@0xintuition/cli/dist/bin/intuition.js'),
		'encode',
		'trustApproveEncode',
		'--args',
		'["0x1111111111111111111111111111111111111111","1000"]',
	]).trim();
	assert.equal(
		cliCalldata,
		'0x095ea7b3000000000000000000000000111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000003e8'
	);

	console.log('Clean-room tarball smoke passed for all public alpha packages.');
} finally {
	rmSync(tempRoot, { force: true, recursive: true });
	for (const tarballPath of tarballPaths) {
		rmSync(tarballPath, { force: true });
	}
}
