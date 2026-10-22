import { BeaconProxyBytecode } from '@0xintuition/deployments/bytecode';
import type { AtomId, OAuthAtomInput } from '@0xintuition/ids';
import { calculateOAuthAtomId } from '@0xintuition/ids';
import {
	AtomWalletAbi,
	multiVaultComputeAtomWalletAddr,
	multiVaultGetWalletConfig,
	type ReadConfig,
} from '@0xintuition/protocol';
import {
	type Address,
	concatHex,
	encodeAbiParameters,
	encodeFunctionData,
	encodePacked,
	getAddress,
	type Hex,
	isAddress,
	isHex,
	keccak256,
} from 'viem';

export const ATOM_WALLET_DERIVATION_VERSION = 'atom-wallet-create2-v1' as const;

export type AtomWalletDerivationConfig = {
	multiVault: Address;
	atomWalletFactory: Address;
	atomWalletBeacon: Address;
	entryPoint: Address;
	beaconProxyCreationCode?: Hex;
	chainId?: number;
};

export type ComputeAtomWalletAddressInput = AtomWalletDerivationConfig & {
	atomId: AtomId | Hex;
};

export type ComputeOAuthAtomWalletAddressInput = AtomWalletDerivationConfig & OAuthAtomInput;

export function computeAtomWalletDeploymentData(input: {
	atomId: AtomId | Hex;
	multiVault: Address;
	atomWalletBeacon: Address;
	entryPoint: Address;
	beaconProxyCreationCode?: Hex;
}): Hex {
	assertBytes32(input.atomId, 'atomId');
	const multiVault = assertAddress(input.multiVault, 'multiVault');
	const atomWalletBeacon = assertAddress(input.atomWalletBeacon, 'atomWalletBeacon');
	const entryPoint = assertAddress(input.entryPoint, 'entryPoint');
	const beaconProxyCreationCode = assertHex(
		input.beaconProxyCreationCode ?? BeaconProxyBytecode,
		'beaconProxyCreationCode'
	);
	const initData = encodeFunctionData({
		abi: AtomWalletAbi,
		functionName: 'initialize',
		args: [entryPoint, multiVault, input.atomId],
	});
	const encodedArgs = encodeAbiParameters(
		[
			{ name: 'beacon', type: 'address' },
			{ name: 'data', type: 'bytes' },
		],
		[atomWalletBeacon, initData]
	);

	return concatHex([beaconProxyCreationCode, encodedArgs]);
}

export function computeAtomWalletAddress(input: ComputeAtomWalletAddressInput): Address {
	const atomId = assertBytes32(input.atomId, 'atomId');
	const atomWalletFactory = assertAddress(input.atomWalletFactory, 'atomWalletFactory');
	const deploymentData = computeAtomWalletDeploymentData(input);
	const rawAddress = keccak256(
		encodePacked(
			['bytes1', 'address', 'bytes32', 'bytes32'],
			['0xff', atomWalletFactory, atomId, keccak256(deploymentData)]
		)
	);

	return getAddress(`0x${rawAddress.slice(-40)}`);
}

export function computeOAuthAtomWalletAddress(input: ComputeOAuthAtomWalletAddressInput): Address {
	return computeAtomWalletAddress({
		...input,
		atomId: calculateOAuthAtomId(input),
	});
}

export async function readAtomWalletAddress(
	config: ReadConfig,
	input: { atomId: AtomId | Hex }
): Promise<Address> {
	const atomId = assertBytes32(input.atomId, 'atomId');
	return getAddress(await multiVaultComputeAtomWalletAddr(config, { args: [atomId] }));
}

export async function readAtomWalletDerivationConfig(
	config: ReadConfig & { chainId?: number }
): Promise<AtomWalletDerivationConfig> {
	const walletConfig = await multiVaultGetWalletConfig(config);
	const resolved = normalizeWalletConfig(walletConfig);

	return {
		chainId: config.chainId,
		multiVault: assertAddress(config.address, 'multiVault'),
		entryPoint: resolved.entryPoint,
		atomWalletFactory: resolved.atomWalletFactory,
		atomWalletBeacon: resolved.atomWalletBeacon,
		beaconProxyCreationCode: BeaconProxyBytecode,
	};
}

function normalizeWalletConfig(walletConfig: unknown): {
	entryPoint: Address;
	atomWalletFactory: Address;
	atomWalletBeacon: Address;
} {
	if (Array.isArray(walletConfig)) {
		return {
			entryPoint: assertAddress(walletConfig[0], 'entryPoint'),
			atomWalletBeacon: assertAddress(walletConfig[2], 'atomWalletBeacon'),
			atomWalletFactory: assertAddress(walletConfig[3], 'atomWalletFactory'),
		};
	}

	if (walletConfig && typeof walletConfig === 'object') {
		const value = walletConfig as Record<string, unknown>;
		return {
			entryPoint: assertAddress(value.entryPoint, 'entryPoint'),
			atomWalletBeacon: assertAddress(value.atomWalletBeacon, 'atomWalletBeacon'),
			atomWalletFactory: assertAddress(value.atomWalletFactory, 'atomWalletFactory'),
		};
	}

	throw new Error('Wallet config is missing or invalid.');
}

function assertAddress(value: unknown, name: string): Address {
	if (typeof value !== 'string' || !isAddress(value)) {
		throw new Error(`${name} must be a valid address.`);
	}

	return getAddress(value);
}

function assertHex(value: unknown, name: string): Hex {
	if (typeof value !== 'string' || !isHex(value)) {
		throw new Error(`${name} must be valid hex.`);
	}

	return value;
}

function assertBytes32(value: unknown, name: string): Hex {
	const hex = assertHex(value, name);
	if (hex.length !== 66) {
		throw new Error(`${name} must be a 32-byte hex value.`);
	}

	return hex;
}
