import { type Address, formatUnits, isAddress, parseUnits } from 'viem';
import { AUTO_SLIPPAGE_BPS, BRIDGE_FLOWS_BY_DIRECTION, DEFAULT_BASE_TOKENS } from './constants';
import type {
	ApprovalPolicy,
	BridgeDirection,
	BridgeFlow,
	BridgeFlowConfig,
	BridgeSourceMode,
	BridgeToken,
	SlippageMode,
} from './types';

export function sameAddress(left: string, right: string): boolean {
	return left.toLowerCase() === right.toLowerCase();
}

export function dedupeTokens(tokens: readonly BridgeToken[]): BridgeToken[] {
	const deduped: BridgeToken[] = [];
	for (const token of tokens) {
		if (!deduped.some((existing) => sameAddress(existing.address, token.address))) {
			deduped.push(token);
		}
	}
	return deduped;
}

export function formatTokenAmount(
	value: bigint | null,
	decimals: number,
	maxFractionDigits = 6
): string {
	if (value === null) {
		return '-';
	}

	const formatted = formatUnits(value, decimals);
	const [wholeRaw = '0', fraction = ''] = formatted.split('.');
	const trimmedFraction = fraction.replace(/0+$/, '').slice(0, maxFractionDigits);
	return trimmedFraction ? `${wholeRaw}.${trimmedFraction}` : wholeRaw;
}

export function formatInputAmount(value: bigint, decimals: number): string {
	const formatted = formatUnits(value, decimals);
	const [wholeRaw = '0', fraction = ''] = formatted.split('.');
	const trimmedFraction = fraction.replace(/0+$/, '').slice(0, 8);
	return trimmedFraction ? `${wholeRaw}.${trimmedFraction}` : wholeRaw;
}

export function parseAmount(value: string, decimals: number): bigint | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	try {
		const parsed = parseUnits(trimmed, decimals);
		if (parsed <= 0n) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export function safeAddress(value: string): Address | null {
	return isAddress(value) ? value : null;
}

export function shortAddress(value: Address): string {
	return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function parseSlippageBps(mode: SlippageMode, value: string): bigint | null {
	if (mode === 'auto') {
		return AUTO_SLIPPAGE_BPS;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	const parsed = Number(trimmed);
	if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 100) {
		return null;
	}

	const bps = Math.round(parsed * 100);
	if (bps <= 0 || bps >= 10_000) {
		return null;
	}

	return BigInt(bps);
}

export function toBridgeToken(token: {
	address: string;
	name: string;
	symbol: string;
	decimals: number;
}): BridgeToken | null {
	const tokenAddress = safeAddress(token.address);
	if (!tokenAddress) {
		return null;
	}

	return {
		address: tokenAddress,
		name: token.name,
		symbol: token.symbol,
		decimals: token.decimals,
	};
}

export function getSeedTokens(tokenOptions: readonly BridgeToken[]): BridgeToken[] {
	return dedupeTokens([...DEFAULT_BASE_TOKENS, ...tokenOptions]);
}

export function getAvailableFlows(direction: BridgeDirection): readonly BridgeFlow[] {
	return BRIDGE_FLOWS_BY_DIRECTION[direction];
}

export function shouldShowSlippage(flow: BridgeFlow): boolean {
	return flow === 'swapToTrust';
}

export function getMaxSpendableNative(balance: bigint | null, reserve: bigint): bigint {
	if (balance === null || balance <= reserve) {
		return 0n;
	}

	return balance - reserve;
}

export function getFlowConfig(
	direction: BridgeDirection,
	flow: BridgeFlow,
	sourceMode: BridgeSourceMode = 'token'
): BridgeFlowConfig {
	if (flow === 'swapToTrust') {
		return {
			direction,
			flow,
			asset: 'TRUST',
			approvalPolicy: 'required',
			supportsSlippage: true,
			sourceMode,
		};
	}

	let asset: BridgeFlowConfig['asset'];
	let approvalPolicy: ApprovalPolicy = 'required';

	if (flow === 'bridgeTrust') {
		asset = 'TRUST';
		approvalPolicy = direction === 'intuitionToBase' ? 'notRequired' : 'required';
	} else if (flow === 'bridgeUsdc') {
		asset = 'USDC';
		approvalPolicy = direction === 'intuitionToBase' ? 'notRequired' : 'required';
	} else {
		asset = 'WETH';
		approvalPolicy =
			direction === 'intuitionToBase' || sourceMode === 'native' ? 'notRequired' : 'required';
	}

	return {
		direction,
		flow,
		asset,
		approvalPolicy,
		supportsSlippage: false,
		sourceMode,
	};
}
