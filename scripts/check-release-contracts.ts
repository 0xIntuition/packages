/** Authoritative release gate; offline candidate fingerprints do not establish source parity. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as publishedAbis from '@0xintuition/contracts-v2/abis';
import * as publishedBytecodes from '@0xintuition/contracts-v2/bytecodes';
import * as abis from '../packages/deployments/src/abis/index';
import * as bytecodes from '../packages/deployments/src/bytecode/index';
import { lockedResolution, verifyRegistryArtifact } from './sync-protocol-artifacts.mjs';

const routerPackage = '@0xintuition/contracts-v2-periphery';
const routerVersion = '1.1.0-alpha.0';
const root = resolve(import.meta.dirname, '..');
const sourceRoot = resolve(root, 'node_modules', routerPackage);
await verifyRegistryArtifact({
	packageName: routerPackage,
	version: routerVersion,
	sourceRoot,
	locked: lockedResolution(readFileSync, routerPackage, routerVersion),
});
const routerAbis = await import('@0xintuition/contracts-v2-periphery/abis');
const routerBytecodes = await import('@0xintuition/contracts-v2-periphery/bytecodes');
const source = {
	...publishedAbis,
	...publishedBytecodes,
	TrustSwapAndBridgeRouterAbi: routerAbis.TrustSwapAndBridgeRouterAbi,
	TrustSwapAndBridgeRouterBytecode: routerBytecodes.TrustSwapAndBridgeRouterBytecode,
} as Record<string, unknown>;
const shipped = { ...abis, ...bytecodes } as Record<string, unknown>;
const failures: string[] = [];
// Verify every central export present upstream and require sources for new
// artifact families. Legacy Metalayer/OpenZeppelin exports remain vendored;
// their fingerprints alone are not an assertion of upstream authenticity.
const required = new Set([
	...Object.keys(shipped).filter((name) => name in source),
	'MultiVaultAbi',
	'MultiVaultBytecode',
	'MultiVaultMigrationModeAbi',
	'MultiVaultMigrationModeBytecode',
	'AtomWardenAbi',
	'AtomWardenBytecode',
	'DynamicFeeFlatPriceCurveAbi',
	'DynamicFeeFlatPriceCurveBytecode',
	'FeeProxyAbi',
	'FeeProxyBytecode',
	'IBaseCurveAbi',
	'TimelockControllerAbi',
	'TimelockControllerBytecode',
	'TrustSwapAndBridgeRouterAbi',
	'TrustSwapAndBridgeRouterBytecode',
]);
for (const name of required) {
	if (!source[name])
		failures.push(
			`${name}: absent from the pinned contracts artifact; an authoritative source is required`
		);
	else if (JSON.stringify(source[name]) !== JSON.stringify(shipped[name]))
		failures.push(`${name}: differs from the pinned contracts artifact`);
}
if (failures.length)
	throw new Error(
		`Contract release gate failed:\n${failures.join('\n')}\nSee docs/contract-artifacts.md. Do not overwrite artifacts without resolving the intended contract revision.`
	);
console.log('Release contract artifacts match the pinned source.');
