import { type Address, type Hex, parseEther, toHex } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import {
	MultiVaultAbi,
	multiVaultAccumulatedAtomWalletDepositFees,
	multiVaultAccumulatedProtocolFees,
	multiVaultApprove,
	multiVaultCalculateAtomId,
	multiVaultCalculateCounterTripleId,
	multiVaultCalculateTripleId,
	multiVaultClaimAtomWalletDepositFees,
	multiVaultComputeAtomWalletAddr,
	multiVaultCreateAtoms,
	multiVaultCreateTriples,
	multiVaultCurrentEpoch,
	multiVaultDeposit,
	multiVaultGetAtomWarden,
	multiVaultGetCounterIdFromTripleId,
	multiVaultGetShares,
	multiVaultGetTripleIdFromCounterId,
	multiVaultGetVaultFees,
	multiVaultGetVaultType,
	multiVaultIsAtom,
	multiVaultPreviewTripleCreate,
	multiVaultSweepAccumulatedProtocolFees,
} from '../../src';
import { calculateAtomId, calculateCounterTripleId, calculateTripleId } from '../helpers/calculate';
import { deployAndInit } from '../helpers/deploy-multivault';
import { publicClient, userWalletClient, walletClient } from '../helpers/utils';

let address: Address;
let subjectAtomId: Hex;
let predicateAtomId: Hex;
let objectAtomId: Hex;
let tripleId: Hex;
let counterTripleId: Hex;
let atomWalletAddr: Address;

const curveId = 1n;

async function readDirect(functionName: string, args: readonly unknown[] = []) {
	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: functionName as never,
		args: args as never,
	});
}

beforeAll(async () => {
	address = await deployAndInit();

	const atomAssets = parseEther('5');
	const tripleAssets = parseEther('6');

	const subjectData = toHex(`mv additions subject ${Math.random()}`);
	const predicateData = toHex(`mv additions predicate ${Math.random()}`);
	const objectData = toHex(`mv additions object ${Math.random()}`);

	subjectAtomId = calculateAtomId(subjectData);
	predicateAtomId = calculateAtomId(predicateData);
	objectAtomId = calculateAtomId(objectData);
	tripleId = calculateTripleId(subjectAtomId, predicateAtomId, objectAtomId);
	counterTripleId = calculateCounterTripleId(tripleId);

	const createAtomsHash = await multiVaultCreateAtoms(
		{ address, publicClient, walletClient },
		{
			args: [
				[subjectData, predicateData, objectData],
				[atomAssets, atomAssets, atomAssets],
			],
			value: atomAssets * 3n,
		}
	);
	await publicClient.waitForTransactionReceipt({ hash: createAtomsHash });

	const createTriplesHash = await multiVaultCreateTriples(
		{ address, publicClient, walletClient },
		{
			args: [[subjectAtomId], [predicateAtomId], [objectAtomId], [tripleAssets]],
			value: tripleAssets,
		}
	);
	await publicClient.waitForTransactionReceipt({ hash: createTriplesHash });

	atomWalletAddr = await multiVaultComputeAtomWalletAddr(
		{ address, publicClient },
		{ args: [subjectAtomId] }
	);
}, 180000);

describe('MultiVault additional wrappers', () => {
	it('exposes additional term and id calculation reads', async () => {
		const readConfig = { address, publicClient };

		const isAtom = await multiVaultIsAtom(readConfig, { args: [subjectAtomId] });
		expect(isAtom).toBe(true);
		expect(isAtom).toEqual(await readDirect('isAtom', [subjectAtomId]));

		const calculatedAtomId = await multiVaultCalculateAtomId(readConfig, {
			args: [toHex('calculated-atom-id')],
		});
		expect(calculatedAtomId).toEqual(
			await readDirect('calculateAtomId', [toHex('calculated-atom-id')])
		);

		const calcTripleId = await multiVaultCalculateTripleId(readConfig, {
			args: [subjectAtomId, predicateAtomId, objectAtomId],
		});
		expect(calcTripleId).toBe(tripleId);
		expect(calcTripleId).toEqual(
			await readDirect('calculateTripleId', [subjectAtomId, predicateAtomId, objectAtomId])
		);

		const calcCounterTripleId = await multiVaultCalculateCounterTripleId(readConfig, {
			args: [subjectAtomId, predicateAtomId, objectAtomId],
		});
		expect(calcCounterTripleId).toBe(counterTripleId);
		expect(calcCounterTripleId).toEqual(
			await readDirect('calculateCounterTripleId', [subjectAtomId, predicateAtomId, objectAtomId])
		);

		const counterFromTriple = await multiVaultGetCounterIdFromTripleId(readConfig, {
			args: [tripleId],
		});
		expect(counterFromTriple).toBe(counterTripleId);
		expect(counterFromTriple).toEqual(await readDirect('getCounterIdFromTripleId', [tripleId]));

		const tripleFromCounter = await multiVaultGetTripleIdFromCounterId(readConfig, {
			args: [counterTripleId],
		});
		expect(tripleFromCounter).toBe(tripleId);
		expect(tripleFromCounter).toEqual(
			await readDirect('getTripleIdFromCounterId', [counterTripleId])
		);

		const previewTripleCreate = await multiVaultPreviewTripleCreate(readConfig, {
			args: [tripleId, parseEther('3')],
		});
		expect(previewTripleCreate).toEqual(
			await readDirect('previewTripleCreate', [tripleId, parseEther('3')])
		);
	});

	it('exposes additional config and fee reads', async () => {
		const readConfig = { address, publicClient };
		const currentEpoch = await multiVaultCurrentEpoch(readConfig);

		const atomWarden = await multiVaultGetAtomWarden(readConfig);
		expect(atomWarden).toEqual(await readDirect('getAtomWarden'));

		const vaultFees = await multiVaultGetVaultFees(readConfig);
		expect(vaultFees).toEqual(await readDirect('getVaultFees'));

		const accumulatedProtocolFees = await multiVaultAccumulatedProtocolFees(readConfig, {
			args: [currentEpoch],
		});
		expect(accumulatedProtocolFees).toEqual(
			await readDirect('accumulatedProtocolFees', [currentEpoch])
		);

		const accumulatedAtomWalletFees = await multiVaultAccumulatedAtomWalletDepositFees(readConfig, {
			args: [atomWalletAddr],
		});
		expect(accumulatedAtomWalletFees).toEqual(
			await readDirect('accumulatedAtomWalletDepositFees', [atomWalletAddr])
		);
	});

	it('uses approve wrapper for delegated deposit and sweep wrapper for fee sweep', async () => {
		const owner = walletClient.account.address;
		const delegate = userWalletClient.account.address;
		const writeConfig = { address, publicClient, walletClient };

		const sharesBefore = await multiVaultGetShares(
			{ address, publicClient },
			{ args: [owner, subjectAtomId, curveId] }
		);

		const approveHash = await multiVaultApprove(writeConfig, {
			args: [delegate, 3],
		});
		await publicClient.waitForTransactionReceipt({ hash: approveHash });

		const delegatedDepositHash = await multiVaultDeposit(
			{ address, publicClient, walletClient: userWalletClient },
			{
				args: [owner, subjectAtomId, curveId, 0n],
				value: parseEther('2'),
			}
		);
		await publicClient.waitForTransactionReceipt({ hash: delegatedDepositHash });

		const sharesAfter = await multiVaultGetShares(
			{ address, publicClient },
			{ args: [owner, subjectAtomId, curveId] }
		);
		expect(sharesAfter).toBeGreaterThan(sharesBefore);

		const epoch = await multiVaultCurrentEpoch({ address, publicClient });
		const feesBefore = await multiVaultAccumulatedProtocolFees(
			{ address, publicClient },
			{ args: [epoch] }
		);

		const sweepHash = await multiVaultSweepAccumulatedProtocolFees(writeConfig, {
			args: [epoch],
		});
		await publicClient.waitForTransactionReceipt({ hash: sweepHash });

		const feesAfter = await multiVaultAccumulatedProtocolFees(
			{ address, publicClient },
			{ args: [epoch] }
		);
		expect(feesAfter).toBeLessThanOrEqual(feesBefore);
		if (feesBefore > 0n) {
			expect(feesAfter).toBe(0n);
		}
	});

	it('exposes expected revert path for claimAtomWalletDepositFees when caller is not atom wallet', async () => {
		await expect(
			multiVaultClaimAtomWalletDepositFees(
				{ address, publicClient, walletClient },
				{ args: [subjectAtomId] }
			)
		).rejects.toThrow();

		const vaultType = await multiVaultGetVaultType(
			{ address, publicClient },
			{ args: [subjectAtomId] }
		);
		expect(vaultType).toEqual(await readDirect('getVaultType', [subjectAtomId]));
	});
});
