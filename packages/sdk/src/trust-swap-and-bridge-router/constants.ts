import { getContractAddressFromChainId } from '@0xintuition/deployments';
import type { Address } from 'viem';
import { parseEther } from 'viem';
import type { BridgeDirection, BridgeFlow, BridgeToken } from './types';

export const BASE_CHAIN_ID = 8453;
export const INTUITION_MAINNET_CHAIN_ID = 1155;
export const TRUST_TOKEN_ADDRESS: Address = getContractAddressFromChainId('Trust', BASE_CHAIN_ID);
export const USDC_TOKEN_ADDRESS: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const WETH_TOKEN_ADDRESS: Address = '0x4200000000000000000000000000000000000006';
export const WTRUST_TOKEN_ADDRESS: Address = getContractAddressFromChainId(
	'WrappedTrust',
	INTUITION_MAINNET_CHAIN_ID
);
export const UNISWAP_DEFAULT_TOKEN_LIST_URL = 'https://tokens.uniswap.org';

export const DEFAULT_BASE_TOKENS: readonly BridgeToken[] = [
	{
		symbol: 'TRUST',
		name: 'Trust',
		address: TRUST_TOKEN_ADDRESS,
		decimals: 18,
	},
	{
		symbol: 'USDC',
		name: 'USD Coin',
		address: USDC_TOKEN_ADDRESS,
		decimals: 6,
	},
	{
		symbol: 'DAI',
		name: 'Dai Stablecoin',
		address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
		decimals: 18,
	},
	{
		symbol: 'ETH',
		name: 'Ether',
		address: WETH_TOKEN_ADDRESS,
		decimals: 18,
	},
	{
		symbol: 'cbBTC',
		name: 'Coinbase Wrapped BTC',
		address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
		decimals: 8,
	},
];

export const BALANCE_PERCENTAGES = [25, 50, 75, 100] as const;
export const TOP_TOKEN_ADDRESSES: readonly Address[] = [
	TRUST_TOKEN_ADDRESS,
	WETH_TOKEN_ADDRESS,
	USDC_TOKEN_ADDRESS,
];

export const AUTO_SLIPPAGE_BPS = 100n;
export const BPS_DENOMINATOR = 10_000n;
export const DEFAULT_INPUT_AMOUNT = '10';
export const BASE_ETH_RESERVE_WEI = parseEther('0.0005');
export const INTUITION_TRUST_RESERVE_WEI = parseEther('1');

export const BRIDGE_FLOWS_BY_DIRECTION: Readonly<Record<BridgeDirection, readonly BridgeFlow[]>> = {
	baseToIntuition: ['swapToTrust', 'bridgeTrust', 'bridgeUsdc', 'bridgeWeth'],
	intuitionToBase: ['bridgeTrust', 'bridgeUsdc', 'bridgeWeth'],
};

export const ERC20_ABI = [
	{
		type: 'function',
		name: 'allowance',
		stateMutability: 'view',
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'spender', type: 'address' },
		],
		outputs: [{ name: '', type: 'uint256' }],
	},
	{
		type: 'function',
		name: 'approve',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'spender', type: 'address' },
			{ name: 'amount', type: 'uint256' },
		],
		outputs: [{ name: '', type: 'bool' }],
	},
	{
		type: 'function',
		name: 'balanceOf',
		stateMutability: 'view',
		inputs: [{ name: 'account', type: 'address' }],
		outputs: [{ name: '', type: 'uint256' }],
	},
	{
		type: 'function',
		name: 'name',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ name: '', type: 'string' }],
	},
	{
		type: 'function',
		name: 'symbol',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ name: '', type: 'string' }],
	},
	{
		type: 'function',
		name: 'decimals',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ name: '', type: 'uint8' }],
	},
] as const;
