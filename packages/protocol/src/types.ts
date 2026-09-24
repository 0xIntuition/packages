import type { Address, PublicClient, WalletClient } from 'viem';

export type ReadConfig = {
	address: Address;
	publicClient: PublicClient;
};

export type WriteConfig = {
	address: Address;
	walletClient: WalletClient;
	publicClient: PublicClient;
};

/**
 * MultiVault's `approve` bit-flag union, mirroring the on-chain `ApprovalTypes` enum
 * (`IMultiVault.sol`) member-for-member: DEPOSIT (0b001), REDEMPTION (0b010), CREATION
 * (0b100), and their unions.
 *
 * Plain object + type alias rather than a real `enum`: some consumers (e.g.
 * lab/curve-demo) build with `erasableSyntaxOnly`, which forbids non-erasable `enum`
 * declarations.
 */
export const ApprovalTypes = {
	NONE: 0,
	DEPOSIT: 1,
	REDEMPTION: 2,
	BOTH: 3,
	CREATION: 4,
	DEPOSIT_AND_CREATION: 5,
	REDEMPTION_AND_CREATION: 6,
	ALL: 7,
} as const;

export type ApprovalTypes = (typeof ApprovalTypes)[keyof typeof ApprovalTypes];

export type MultivaultConfig = {
	atom_cost: string;
	formatted_atom_cost: string;
	triple_cost: string;
	formatted_triple_cost: string;
	atom_wallet_initial_deposit_amount: string;
	formatted_atom_wallet_initial_deposit_amount: string;
	atom_creation_protocol_fee: string;
	formatted_atom_creation_protocol_fee: string;
	triple_creation_protocol_fee: string;
	formatted_triple_creation_protocol_fee: string;
	atom_deposit_fraction_on_triple_creation: string;
	formatted_atom_deposit_fraction_on_triple_creation: string;
	atom_deposit_fraction_for_triple: string;
	formatted_atom_deposit_fraction_for_triple: string;
	entry_fee: string;
	formatted_entry_fee: string;
	exit_fee: string;
	formatted_exit_fee: string;
	protocol_fee: string;
	formatted_protocol_fee: string;
	fee_denominator: string;
	formatted_fee_denominator: string;
	min_deposit: string;
	formatted_min_deposit: string;
};

export type IdentityVaultDetailsType = {
	vault_id: string;
	assets_sum: string;
	formatted_assets_sum: string;
	conviction_sum: string;
	formatted_conviction_sum: string;
	conviction_price: string;
	formatted_conviction_price: string;
	entry_fee: string;
	formatted_entry_fee: string;
	exit_fee: string;
	formatted_exit_fee: string;
	protocol_fee: string;
	formatted_protocol_fee: string;
	admin: string;
	protocol_vault: string;
	fee_denominator: string;
	formatted_fee_denominator: string;
	min_deposit: string;
	formatted_min_deposit: string;
	min_share: string;
	formatted_min_share: string;
	atom_cost: string;
	formatted_atom_cost: string;
	atom_creation_fee: string;
	formatted_atom_creation_fee: string;
	user_conviction?: string;
	formatted_user_conviction?: string;
	user_assets?: string;
	formatted_user_assets?: string;
};

export type VaultDetailsType = {
	assets_sum: string;
	formatted_assets_sum: string;
	conviction_sum: string;
	formatted_conviction_sum: string;
	conviction_price: string;
	formatted_conviction_price: string;
	user_conviction?: string;
	formatted_user_conviction?: string;
	user_assets?: string;
	formatted_user_assets?: string;
	against_assets_sum?: string;
	formatted_against_assets_sum?: string;
	against_conviction_sum?: string;
	formatted_against_conviction_sum?: string;
	against_conviction_price?: string;
	formatted_against_conviction_price?: string;
	user_conviction_against?: string;
	formatted_user_conviction_against?: string;
	user_assets_against?: string;
	formatted_user_assets_against?: string;
	entry_fee: string;
	formatted_entry_fee: string;
	exit_fee: string;
	formatted_exit_fee: string;
	protocol_fee: string;
	formatted_protocol_fee: string;
	admin: string;
	protocol_vault: string;
	fee_denominator: string;
	min_deposit: string;
	formatted_min_deposit: string;
	min_share: string;
	formatted_min_share: string;
	atom_cost?: string;
	formatted_atom_cost?: string;
	triple_cost?: string;
	formatted_triple_cost?: string;
	atom_creation_fee?: string;
	formatted_atom_creation_fee?: string;
	isTriple?: boolean;
	triple_creation_fee?: string;
	formatted_triple_creation_fee?: string;
	atom_deposit_fraction_on_triple_creation?: string;
	formatted_atom_deposit_fraction_on_triple_creation?: string;
	atom_deposit_fraction_for_triple?: string;
	formatted_atom_deposit_fraction_for_triple?: string;
};

export type Vault = {
	__typename?: 'vaults';
	total_shares: string | number;
	current_share_price: string | number;
	min_deposit?: string | number;
	position_count?: number;
	allPositions?: {
		aggregate?: {
			count: number;
			sum?: {
				shares: string | number;
			};
		};
	};
};

export type CurveDetailsType = {
	curve_id: string;
	assets_sum: string;
	formatted_assets_sum: string;
	shares_sum: string;
	formatted_shares_sum: string;
	share_price: string;
	formatted_share_price: string;
	market_cap: string;
	formatted_market_cap: string;
	user_shares?: string;
	formatted_user_shares?: string;
	user_assets?: string;
	formatted_user_assets?: string;
	entry_fee: string;
	formatted_entry_fee: string;
	exit_fee: string;
	formatted_exit_fee: string;
	protocol_fee: string;
	formatted_protocol_fee: string;
	admin: string;
	protocol_vault: string;
	fee_denominator: string;
	min_deposit: string;
	formatted_min_deposit: string;
	min_share: string;
	formatted_min_share: string;
};
