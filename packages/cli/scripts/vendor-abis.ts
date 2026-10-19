/**
 * Vendors `src/abis/core/*-abi.ts` / `src/abis/periphery/*-abi.ts` from the current
 * `@0xintuition/deployments` exports, the single source of contract ABIs. The CLI vendors rather
 * than depending on it so the published package installs with only `viem`. The encoder
 * generators (`generate-core-encoders.ts` / `generate-periphery-encoders.ts`) read
 * these vendored copies, not the packages directly, so a package ABI regen must be
 * followed by a re-vendor here before re-running the encoder generators — otherwise
 * the generated encoders type-check against a stale ABI.
 *
 * Wholesale — every vendored contract is refreshed together, not hand-picked, for the
 * same reason the package-level ABI regeneration is wholesale.
 *
 * Run:
 *   bun run vendor:abis
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as deployments from '@0xintuition/deployments';

const ROOT = path.resolve(import.meta.dir, '..');
const CORE_OUT_DIR = path.join(ROOT, 'src/abis/core');
const PERIPHERY_OUT_DIR = path.join(ROOT, 'src/abis/periphery');

const CORE_CONTRACTS = [
	'BaseEmissionsController',
	'MultiVault',
	'SatelliteEmissionsController',
	'Trust',
	'TrustBonding',
	'WrappedTrust',
	'DynamicFeeFlatPriceCurve',
	'AtomWarden',
] as const;

const PERIPHERY_CONTRACTS = [
	'MetaERC20Hub',
	'MetaERC20Spoke',
	'MetaNativeSpoke',
	'TrustSwapAndBridgeRouter',
	'FeeProxy',
] as const;

async function vendor(
	outDir: string,
	source: Record<string, unknown>,
	contracts: readonly string[]
): Promise<void> {
	for (const contract of contracts) {
		const exportName = `${contract}Abi`;
		const abi = source[exportName];
		if (!Array.isArray(abi)) {
			throw new Error(`Could not find ABI export "${exportName}".`);
		}
		const body = `export const ${exportName} = ${JSON.stringify(abi, null, '\t')} as const;\n`;
		await writeFile(path.join(outDir, `${contract}-abi.ts`), body, 'utf8');
		console.log(`vendored ${exportName} (${abi.length} entries)`);
	}
}

async function main(): Promise<void> {
	await vendor(CORE_OUT_DIR, deployments as Record<string, unknown>, CORE_CONTRACTS);
	await vendor(PERIPHERY_OUT_DIR, deployments as Record<string, unknown>, PERIPHERY_CONTRACTS);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
