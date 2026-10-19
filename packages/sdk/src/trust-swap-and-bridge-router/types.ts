import type { Address } from 'viem';

export type BridgeToken = {
	symbol: string;
	name: string;
	address: Address;
	decimals: number;
};

export type UniswapTokenListResponse = {
	tokens?: Array<{
		chainId: number;
		address: string;
		name: string;
		symbol: string;
		decimals: number;
	}>;
};

export type SlippageMode = 'auto' | 'custom';

export type BridgeDirection = 'baseToIntuition' | 'intuitionToBase';
export type BridgeFlow = 'swapToTrust' | 'bridgeTrust' | 'bridgeUsdc' | 'bridgeWeth';
export type BridgeSourceMode = 'token' | 'native';
export type ApprovalPolicy = 'required' | 'notRequired';

export type BridgeFlowConfig = {
	direction: BridgeDirection;
	flow: BridgeFlow;
	asset: 'TRUST' | 'USDC' | 'WETH';
	approvalPolicy: ApprovalPolicy;
	supportsSlippage: boolean;
	sourceMode?: BridgeSourceMode;
};
