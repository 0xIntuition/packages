import { type Address, type Hex, parseEther, toHex } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import {
	MultiVaultAbi,
	multiVaultAtom,
	multiVaultAtomDepositFractionAmount,
	multiVaultConvertToAssets,
	multiVaultConvertToShares,
	multiVaultCreateAtoms,
	multiVaultCreateTriples,
	multiVaultCurrentEpoch,
	multiVaultCurrentSharePrice,
	multiVaultDeposit,
	multiVaultEntryFeeAmount,
	multiVaultExitFeeAmount,
	multiVaultGetAtom,
	multiVaultGetAtomConfig,
	multiVaultGetAtomCost,
	multiVaultGetBondingCurveConfig,
	multiVaultGetGeneralConfig,
	multiVaultGetInverseTripleId,
	multiVaultGetShares,
	multiVaultGetTotalUtilizationForEpoch,
	multiVaultGetTriple,
	multiVaultGetTripleConfig,
	multiVaultGetTripleCost,
	multiVaultGetUserLastActiveEpoch,
	multiVaultGetUserUtilizationForEpoch,
	multiVaultGetUserUtilizationInEpoch,
	multiVaultGetVault,
	multiVaultGetVaultType,
	multiVaultGetWalletConfig,
	multiVaultIsCounterTriple,
	multiVaultIsTermCreated,
	multiVaultIsTriple,
	multiVaultMaxRedeem,
	multiVaultMultiCallIntuitionConfigs,
	multiVaultPreviewDeposit,
	multiVaultProtocolFeeAmount,
	multiVaultTriple,
} from '../../src';
import { calculateAtomId, calculateCounterTripleId, calculateTripleId } from '../helpers/calculate';
import { deployAndInit } from '../helpers/deploy-multivault';
import { publicClient, walletClient } from '../helpers/utils';

let address: Address;
let subjectAtomId: Hex;
let predicateAtomId: Hex;
let objectAtomId: Hex;
let tripleId: Hex;
let counterTripleId: Hex;

const curveId = 1n;

async function readMultiVaultDirect(functionName: string, args: readonly unknown[] = []) {
	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: functionName as never,
		args: args as never,
	});
}

beforeAll(async () => {
	address = await deployAndInit();

	const atomAssets = parseEther('10');
	const tripleAssets = parseEther('8');
	const depositAssets = parseEther('6');

	const subjectData = toHex(`mv read subject ${Math.random()}`);
	const predicateData = toHex(`mv read predicate ${Math.random()}`);
	const objectData = toHex(`mv read object ${Math.random()}`);

	subjectAtomId = calculateAtomId(subjectData);
	predicateAtomId = calculateAtomId(predicateData);
	objectAtomId = calculateAtomId(objectData);
	tripleId = calculateTripleId(subjectAtomId, predicateAtomId, objectAtomId);
	counterTripleId = calculateCounterTripleId(tripleId);

	const createAtomsHash = await multiVaultCreateAtoms(
		{
			walletClient,
			publicClient,
			address,
		},
		{
			args: [
				[subjectData, predicateData, objectData],
				[atomAssets, atomAssets, atomAssets],
			],
			value: atomAssets * 3n,
		}
	);
	await publicClient.waitForTransactionReceipt({ hash: createAtomsHash });

	const createTripleHash = await multiVaultCreateTriples(
		{
			walletClient,
			publicClient,
			address,
		},
		{
			args: [[subjectAtomId], [predicateAtomId], [objectAtomId], [tripleAssets]],
			value: tripleAssets,
		}
	);
	await publicClient.waitForTransactionReceipt({ hash: createTripleHash });

	const depositHash = await multiVaultDeposit(
		{
			walletClient,
			publicClient,
			address,
		},
		{
			args: [walletClient.account.address, subjectAtomId, curveId, 0n],
			value: depositAssets,
		}
	);
	await publicClient.waitForTransactionReceipt({ hash: depositHash });
}, 180000);

describe('MultiVault read wrappers', () => {
	it('exposes config and cost reads', async () => {
		const readConfig = { publicClient, address };

		const currentEpoch = await multiVaultCurrentEpoch(readConfig);
		expect(currentEpoch).toEqual(await readMultiVaultDirect('currentEpoch'));

		const atomConfig = await multiVaultGetAtomConfig(readConfig);
		expect(atomConfig).toEqual(await readMultiVaultDirect('getAtomConfig'));

		const tripleConfig = await multiVaultGetTripleConfig(readConfig);
		expect(tripleConfig).toEqual(await readMultiVaultDirect('getTripleConfig'));

		const generalConfig = await multiVaultGetGeneralConfig(readConfig);
		expect(generalConfig).toEqual(await readMultiVaultDirect('getGeneralConfig'));

		const walletConfig = await multiVaultGetWalletConfig(readConfig);
		expect(walletConfig).toEqual(await readMultiVaultDirect('getWalletConfig'));

		const bondingCurveConfig = await multiVaultGetBondingCurveConfig(readConfig);
		expect(bondingCurveConfig).toEqual(await readMultiVaultDirect('getBondingCurveConfig'));

		const atomCost = await multiVaultGetAtomCost(readConfig);
		expect(atomCost).toEqual(await readMultiVaultDirect('getAtomCost'));

		const tripleCost = await multiVaultGetTripleCost(readConfig);
		expect(tripleCost).toEqual(await readMultiVaultDirect('getTripleCost'));

		const multicallConfig = await multiVaultMultiCallIntuitionConfigs({ address, publicClient });
		expect(multicallConfig.atom_cost).toBe(atomCost.toString());
		expect(multicallConfig.triple_cost).toBe(tripleCost.toString());
		expect(multicallConfig.formatted_atom_cost.length).toBeGreaterThan(0);
		expect(multicallConfig.formatted_triple_cost.length).toBeGreaterThan(0);
	});

	it('exposes term and vault metadata reads', async () => {
		const readConfig = { publicClient, address };

		const atom = await multiVaultAtom(readConfig, { args: [subjectAtomId] });
		expect(atom).toEqual(await readMultiVaultDirect('atom', [subjectAtomId]));

		const getAtom = await multiVaultGetAtom(readConfig, { args: [subjectAtomId] });
		expect(getAtom).toEqual(await readMultiVaultDirect('getAtom', [subjectAtomId]));

		const triple = await multiVaultTriple(readConfig, { args: [tripleId] });
		expect(triple).toEqual(await readMultiVaultDirect('triple', [tripleId]));

		const getTriple = await multiVaultGetTriple(readConfig, { args: [tripleId] });
		expect(getTriple).toEqual(await readMultiVaultDirect('getTriple', [tripleId]));

		const inverseTripleId = await multiVaultGetInverseTripleId(readConfig, { args: [tripleId] });
		expect(inverseTripleId).toEqual(await readMultiVaultDirect('getInverseTripleId', [tripleId]));
		expect(inverseTripleId).toBe(counterTripleId);

		const termCreatedAtom = await multiVaultIsTermCreated(readConfig, { args: [subjectAtomId] });
		expect(termCreatedAtom).toEqual(await readMultiVaultDirect('isTermCreated', [subjectAtomId]));
		expect(termCreatedAtom).toBe(true);

		const termCreatedTriple = await multiVaultIsTermCreated(readConfig, { args: [tripleId] });
		expect(termCreatedTriple).toEqual(await readMultiVaultDirect('isTermCreated', [tripleId]));
		expect(termCreatedTriple).toBe(true);

		const isTriple = await multiVaultIsTriple(readConfig, { args: [tripleId] });
		expect(isTriple).toEqual(await readMultiVaultDirect('isTriple', [tripleId]));

		const isCounterTriple = await multiVaultIsCounterTriple(readConfig, {
			args: [counterTripleId],
		});
		expect(isCounterTriple).toEqual(
			await readMultiVaultDirect('isCounterTriple', [counterTripleId])
		);

		const atomVaultType = await multiVaultGetVaultType(readConfig, { args: [subjectAtomId] });
		expect(atomVaultType).toEqual(await readMultiVaultDirect('getVaultType', [subjectAtomId]));

		const tripleVaultType = await multiVaultGetVaultType(readConfig, { args: [tripleId] });
		expect(tripleVaultType).toEqual(await readMultiVaultDirect('getVaultType', [tripleId]));
	});

	it('exposes share, vault and pricing reads', async () => {
		const readConfig = { publicClient, address };
		const writeConfig = { publicClient, walletClient, address };
		const account = walletClient.account.address;
		const assets = parseEther('3');

		const sharePrice = await multiVaultCurrentSharePrice(readConfig, {
			args: [subjectAtomId, curveId],
		});
		expect(sharePrice).toEqual(
			await readMultiVaultDirect('currentSharePrice', [subjectAtomId, curveId])
		);

		const vault = await multiVaultGetVault(readConfig, {
			args: [subjectAtomId, curveId],
		});
		expect(vault).toEqual(await readMultiVaultDirect('getVault', [subjectAtomId, curveId]));

		const shares = await multiVaultGetShares(readConfig, {
			args: [account, subjectAtomId, curveId],
		});
		expect(shares).toEqual(
			await readMultiVaultDirect('getShares', [account, subjectAtomId, curveId])
		);
		expect(shares).toBeGreaterThan(0n);

		const maxRedeem = await multiVaultMaxRedeem(readConfig, {
			args: [account, subjectAtomId, curveId],
		});
		expect(maxRedeem).toEqual(
			await readMultiVaultDirect('maxRedeem', [account, subjectAtomId, curveId])
		);
		expect(maxRedeem).toBeGreaterThanOrEqual(shares);

		const previewDeposit = await multiVaultPreviewDeposit(writeConfig, {
			args: [subjectAtomId, curveId, assets],
		});
		expect(previewDeposit).toEqual(
			await readMultiVaultDirect('previewDeposit', [subjectAtomId, curveId, assets])
		);

		const convertToShares = await multiVaultConvertToShares(readConfig, {
			args: [subjectAtomId, curveId, assets],
		});
		expect(convertToShares).toEqual(
			await readMultiVaultDirect('convertToShares', [subjectAtomId, curveId, assets])
		);

		const convertToAssets = await multiVaultConvertToAssets(readConfig, {
			args: [subjectAtomId, curveId, convertToShares],
		});
		expect(convertToAssets).toEqual(
			await readMultiVaultDirect('convertToAssets', [subjectAtomId, curveId, convertToShares])
		);

		const entryFee = await multiVaultEntryFeeAmount(readConfig, { args: [assets] });
		expect(entryFee).toEqual(await readMultiVaultDirect('entryFeeAmount', [assets]));
		expect(entryFee).toBeGreaterThanOrEqual(0n);

		const exitFee = await multiVaultExitFeeAmount(readConfig, { args: [assets] });
		expect(exitFee).toEqual(await readMultiVaultDirect('exitFeeAmount', [assets]));
		expect(exitFee).toBeGreaterThanOrEqual(0n);

		const protocolFee = await multiVaultProtocolFeeAmount(readConfig, { args: [assets] });
		expect(protocolFee).toEqual(await readMultiVaultDirect('protocolFeeAmount', [assets]));
		expect(protocolFee).toBeGreaterThanOrEqual(0n);

		const atomFractionAmount = await multiVaultAtomDepositFractionAmount(readConfig, {
			args: [assets],
		});
		expect(atomFractionAmount).toEqual(
			await readMultiVaultDirect('atomDepositFractionAmount', [assets])
		);
		expect(atomFractionAmount).toBeGreaterThanOrEqual(0n);
	});

	it('exposes epoch utilization reads', async () => {
		const readConfig = { publicClient, address };
		const account = walletClient.account.address;
		const currentEpoch = await multiVaultCurrentEpoch(readConfig);

		const totalUtilization = await multiVaultGetTotalUtilizationForEpoch(readConfig, {
			args: [currentEpoch],
		});
		expect(totalUtilization).toEqual(
			await readMultiVaultDirect('getTotalUtilizationForEpoch', [currentEpoch])
		);

		const userLastActiveEpoch = await multiVaultGetUserLastActiveEpoch(readConfig, {
			args: [account],
		});
		expect(userLastActiveEpoch).toEqual(
			await readMultiVaultDirect('getUserLastActiveEpoch', [account])
		);

		const userUtilizationForEpoch = await multiVaultGetUserUtilizationForEpoch(readConfig, {
			args: [account, currentEpoch],
		});
		expect(userUtilizationForEpoch).toEqual(
			await readMultiVaultDirect('getUserUtilizationForEpoch', [account, currentEpoch])
		);

		const userUtilizationInEpoch = await multiVaultGetUserUtilizationInEpoch(readConfig, {
			args: [account, currentEpoch],
		});
		expect(userUtilizationInEpoch).toEqual(
			await readMultiVaultDirect('getUserUtilizationInEpoch', [account, currentEpoch])
		);
	});
});
