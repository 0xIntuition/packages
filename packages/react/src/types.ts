import type { Address, Chain, Hex } from 'viem';

/**
 * Network preset identifiers for Intuition chains.
 */
export type IntuitionNetwork = 'mainnet' | 'testnet';

/**
 * Optional chain override for read hooks. When provided, the hook reads
 * from this chain instead of the provider's default chain.
 */
export type ChainOverride = {
	/** Override the chain ID used for contract reads. */
	chainId?: number;
};

/**
 * Status of a transaction flow lifecycle.
 */
export type TransactionFlowStatus = 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'error';

/**
 * Configuration for connecting to the Intuition protocol.
 * Provided via {@link IntuitionProvider} and consumed by all hooks.
 */
export type IntuitionConfig = {
	/** The chain definition (from viem). */
	chain: Chain;
	/** The chain ID for the active network. */
	chainId: number;
	/** The deployed MultiVault contract address. */
	multivaultAddress: Address;
};

/**
 * Return type for vault state queries.
 */
export type VaultState = {
	/** Total assets locked in the vault (wei). */
	totalAssets: bigint;
	/** Total shares outstanding. */
	totalShares: bigint;
	/** Current price per share (18-decimal fixed point). */
	sharePrice: bigint;
};

/**
 * Return type for deposit preview calculations.
 */
export type DepositPreview = {
	/** Shares the depositor would receive. */
	sharesOut: bigint;
	/** Assets remaining after fees. */
	assetsAfterFees: bigint;
	/** Entry fee deducted from the deposit. */
	entryFee: bigint;
	/** Protocol fee deducted from the deposit. */
	protocolFee: bigint;
};

/**
 * Return type for redeem preview calculations.
 */
export type RedeemPreview = {
	/** Assets the redeemer would receive. */
	assetsOut: bigint;
	/** Shares that would be consumed. */
	sharesUsed: bigint;
	/** Exit fee deducted from the redemption. */
	exitFee: bigint;
	/** Protocol fee deducted from the redemption. */
	protocolFee: bigint;
};

/**
 * A user's position in a specific vault.
 */
export type PositionData = {
	/** Address of the position holder. */
	account: Address;
	/** The term ID (atom or triple). */
	termId: Hex;
	/** The bonding curve ID. */
	curveId: bigint;
	/** Shares held by the user. */
	shares: bigint;
	/** Maximum shares the user can redeem. */
	maxRedeemShares: bigint;
	/** Estimated asset value of current shares. */
	estimatedAssets: bigint;
};

/**
 * Protocol fee structure as read from the MultiVault contract's `getVaultFees`.
 */
export type ProtocolFees = {
	/** Entry fee numerator. */
	entryFee: bigint;
	/** Exit fee numerator. */
	exitFee: bigint;
	/** Protocol fee numerator. */
	protocolFee: bigint;
};
