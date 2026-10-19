import type { DynamicFeeConfig } from '@0xintuition/curves';
import { type Address, encodeFunctionData, type Hex, isAddressEqual } from 'viem';

import {
	BondingCurveRegistryAbi,
	DynamicFeeFlatPriceCurveAbi,
	DynamicFeeFlatPriceCurveBytecode,
	TransparentUpgradeableProxyAbi,
	TransparentUpgradeableProxyBytecode,
} from '../../src/contracts';
import { ALICE } from './constants';
import { type CoreDeployment, deployCoreContracts } from './deploy-multivault';
import { publicClient, walletClient } from './utils';

/** Must match `CURVE_NAME` in `DeployDynamicFeeFlatPriceCurve.s.sol`; the registry rejects duplicates. */
export const DYNAMIC_FEE_CURVE_NAME = 'Dynamic Fee Flat Price Curve';

/**
 * The launch schedule, mirrored field for field from `DynamicFeeLaunchSchedule.config()` in the
 * core contracts' `script/intuition/DynamicFeeLaunchSchedule.sol`. The dynamic-fee integration suite
 * parses that file and fails if the two drift apart.
 */
export const DYNAMIC_FEE_LAUNCH_CONFIG: DynamicFeeConfig = {
	width0: 2000n * 10n ** 18n,
	tierCount: 16n,
	tierWidthGrowthBps: 3500n,
	depositBaseBps: 100n,
	depositGrowthBps: 45n,
	depositCapBps: 550n,
	depositFulcrumAlphaBps: 5000n,
	depositKernelSpread: 6n * 10n ** 18n,
	redeemFulcrumAlphaBps: 5000n,
	redeemKernelSpread: 6n * 10n ** 18n,
	redeemBaseBps: 150n,
	redeemGrowthBps: 35n,
	redeemCapBps: 450n,
	redeemToFulcrumTiersBps: 7500n,
	depositToPriorTierBps: 1000n,
	minEligibleTierStakeBps: 0n,
};

export type DynamicFeeCurveDeployment = {
	core: CoreDeployment;
	curveAddress: Address;
	curveId: bigint;
	/**
	 * The curve owner. On anvil the deploy script sets it to the broadcaster, which is the anvil
	 * admin (account 0); the registry owner is the same account, so both legs are signable here.
	 */
	owner: Address;
};

let deployPromise: Promise<DynamicFeeCurveDeployment> | undefined;

async function waitForSuccess(hash: Hex): Promise<void> {
	const receipt = await publicClient.waitForTransactionReceipt({ hash });
	if (receipt.status !== 'success') {
		throw new Error(`transaction ${hash} reverted`);
	}
}

/** Walks the registry for a curve already registered under the launch name on this anvil instance. */
async function findRegisteredCurve(registry: Address): Promise<Address | undefined> {
	const count = await publicClient.readContract({
		address: registry,
		abi: BondingCurveRegistryAbi,
		functionName: 'count',
	});
	for (let id = 1n; id <= count; id++) {
		const name = await publicClient.readContract({
			address: registry,
			abi: BondingCurveRegistryAbi,
			functionName: 'getCurveName',
			args: [id],
		});
		if (name === DYNAMIC_FEE_CURVE_NAME) {
			return await publicClient.readContract({
				address: registry,
				abi: BondingCurveRegistryAbi,
				functionName: 'curveAddresses',
				args: [id],
			});
		}
	}
	return undefined;
}

/**
 * Deploys `DynamicFeeFlatPriceCurve` from the PACKAGED artifacts (implementation bytecode plus the
 * packaged `TransparentUpgradeableProxy`), initialised atomically with the launch schedule the way
 * `DeployDynamicFeeFlatPriceCurve.s.sol` does on anvil, and registers it with the core
 * deployment's `BondingCurveRegistry`.
 */
async function runDeployment(): Promise<DynamicFeeCurveDeployment> {
	const core = await deployCoreContracts();
	const registry = core.intuition.bondingCurveRegistry;
	const registryOwner = await publicClient.readContract({
		address: registry,
		abi: BondingCurveRegistryAbi,
		functionName: 'owner',
	});
	if (!isAddressEqual(registryOwner, ALICE)) {
		throw new Error(
			`Expected the anvil admin ${ALICE} to own the registry, found ${registryOwner}.`
		);
	}

	let curveAddress = await findRegisteredCurve(registry);
	if (!curveAddress) {
		const implementationHash = await walletClient.deployContract({
			abi: DynamicFeeFlatPriceCurveAbi,
			bytecode: DynamicFeeFlatPriceCurveBytecode,
		});
		const implementationReceipt = await publicClient.waitForTransactionReceipt({
			hash: implementationHash,
		});
		const implementation = implementationReceipt.contractAddress;
		if (!implementation) {
			throw new Error('DynamicFeeFlatPriceCurve implementation deployment returned no address.');
		}

		const initData = encodeFunctionData({
			abi: DynamicFeeFlatPriceCurveAbi,
			functionName: 'initialize',
			args: [DYNAMIC_FEE_CURVE_NAME, ALICE, core.intuition.multiVault, DYNAMIC_FEE_LAUNCH_CONFIG],
		});
		// Anvil branch of the deploy script: the broadcaster is both the proxy admin owner and the curve owner.
		const proxyHash = await walletClient.deployContract({
			abi: TransparentUpgradeableProxyAbi,
			bytecode: TransparentUpgradeableProxyBytecode,
			args: [implementation, ALICE, initData],
		});
		const proxyReceipt = await publicClient.waitForTransactionReceipt({ hash: proxyHash });
		if (!proxyReceipt.contractAddress) {
			throw new Error('DynamicFeeFlatPriceCurve proxy deployment returned no address.');
		}
		curveAddress = proxyReceipt.contractAddress;

		await waitForSuccess(
			await walletClient.writeContract({
				address: registry,
				abi: BondingCurveRegistryAbi,
				functionName: 'addBondingCurve',
				args: [curveAddress],
			})
		);
	}

	const curveId = await publicClient.readContract({
		address: registry,
		abi: BondingCurveRegistryAbi,
		functionName: 'curveIds',
		args: [curveAddress],
	});
	if (curveId === 0n) {
		throw new Error(`DynamicFeeFlatPriceCurve ${curveAddress} is not registered.`);
	}

	return { core, curveAddress, curveId, owner: ALICE };
}

/** Memoised per worker, like `deployCoreContracts`; later files on the same anvil reuse the curve. */
export async function deployDynamicFeeCurve(): Promise<DynamicFeeCurveDeployment> {
	if (!deployPromise) {
		deployPromise = runDeployment();
	}
	return deployPromise;
}
