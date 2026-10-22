import type { ReadConfig, WriteConfig } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';

import {
	type AgentActionEnvelope,
	type AgentActionMetadata,
	type AgentActionTargetIntent,
	bigintToDecimalString,
	type CreateAgentActionStepInput,
	createAgentActionEnvelope,
	type JsonObject,
	type JsonValue,
} from '../schema';

type EnvelopeSerializable =
	| boolean
	| number
	| string
	| bigint
	| null
	| EnvelopeSerializable[]
	| {
			[key: string]: EnvelopeSerializable;
	  };

function serializeEnvelopeValue(value: EnvelopeSerializable): JsonValue {
	if (typeof value === 'bigint') {
		return bigintToDecimalString(value);
	}

	if (Array.isArray(value)) {
		return value.map((item) => serializeEnvelopeValue(item));
	}

	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, serializeEnvelopeValue(item)])
		);
	}

	return value;
}

export function serializeEnvelopeObject(value?: {
	[key: string]: EnvelopeSerializable;
}): JsonObject | undefined {
	if (!value) {
		return undefined;
	}

	return serializeEnvelopeValue(value) as JsonObject;
}

export function requireContext<T>(value: T | undefined, planName: string, field: string): T {
	if (value === undefined) {
		throw new Error(`${planName} requires ${field}.`);
	}

	return value;
}

export function toPureReadConfig(address: Address): ReadConfig {
	return { address } as ReadConfig;
}

export function toPureWriteConfig(address: Address): WriteConfig {
	return { address } as WriteConfig;
}

/**
 * The chain-state a MultiVault fee quote depends on, supplied by the caller rather than read.
 *
 * MultiVault charges its fees on a base that is not always the gross amount — a vault's first
 * deposit has a min-share bootstrap cost netted out first — and waives entry and exit fees entirely
 * while the default curve's vault sits below `feeThreshold`. A plan builder cannot read any of that,
 * so it takes it as context, exactly as it takes previews.
 */
export type MultiVaultFeeReadContext = {
	/** `totalShares` of the vault being deposited into. Zero means this deposit bootstraps it. */
	vaultTotalShares?: bigint;
	/** `totalShares` of the DEFAULT curve's vault, which is what the fee threshold is measured on. */
	defaultVaultTotalShares?: bigint;
	defaultCurveId?: bigint;
	registryAddress?: Address;
	minShare?: bigint;
	feeThreshold?: bigint;
	/** `MultiVault.getGeneralConfig().feeDenominator`, which every fee rate is expressed against. */
	feeDenominator?: bigint;
	isTriple?: boolean;
	/** What `previewMint(minShare, 0, 0, curveId)` returns on the target curve. */
	minShareCostPerUnit?: bigint;
	/** `MultiVault.getAtomConfig().atomWalletDepositFee`, charged on every atom deposit. */
	atomWalletDepositFee?: bigint;
	/** `MultiVault.atomDepositFractionAmount(feeBase)`, charged on every triple deposit. */
	atomDepositFractionAmount?: bigint;
	/** The three atoms under a triple, whose thresholds gate the fraction above. */
	tripleAtomIds?: readonly [Hex, Hex, Hex];
};

const PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000001' as Address;
const PLACEHOLDER_TERM = `0x${'00'.repeat(31)}01` as Hex;

/**
 * Stubs the fee-context reads from caller-supplied values.
 *
 * The defaults describe an established vault above the fee threshold, which is what the previous
 * quote arithmetic assumed unconditionally. A caller quoting the deposit that OPENS a vault, or a
 * term whose default vault is still below the threshold, has to say so — otherwise the plan's fee
 * breakdown will not match what the contract charges.
 */
export function toFeeContextDeps(context: MultiVaultFeeReadContext = {}) {
	const {
		vaultTotalShares = 1n,
		defaultVaultTotalShares = 0n,
		defaultCurveId = 1n,
		registryAddress = PLACEHOLDER_ADDRESS,
		minShare = 0n,
		feeThreshold = 0n,
		feeDenominator = 10_000n,
		isTriple = false,
		minShareCostPerUnit = 0n,
		atomWalletDepositFee = 0n,
		atomDepositFractionAmount = 0n,
		tripleAtomIds = [PLACEHOLDER_TERM, PLACEHOLDER_TERM, PLACEHOLDER_TERM],
	} = context;

	return {
		getVault: async (_config: ReadConfig, inputs: { args: readonly unknown[] }) =>
			(inputs.args[1] === defaultCurveId
				? [0n, defaultVaultTotalShares]
				: [0n, vaultTotalShares]) as never,
		getGeneralConfig: async () =>
			({ minShare, feeThreshold, feeDenominator, minDeposit: 0n, atomDataMaxLength: 0n }) as never,
		getBondingCurveConfig: async () => ({ registry: registryAddress, defaultCurveId }) as never,
		isTriple: async () => isTriple,
		previewMint: async () => minShareCostPerUnit,
		getAtomConfig: async () => [0n, atomWalletDepositFee] as never,
		getTriple: async () => tripleAtomIds as never,
		atomDepositFractionAmount: async () => atomDepositFractionAmount,
	};
}

/** The curve-side reads behind an account-aware withdrawal fee, supplied rather than read. */
export type CurveRedeemFeeReadContext = {
	curveAddress?: Address;
	hasRedeemFeeHook?: boolean;
	curveRedeemFee?: bigint;
};

export function toCurveRedeemFeeDeps(context: CurveRedeemFeeReadContext = {}) {
	const {
		curveAddress = PLACEHOLDER_ADDRESS,
		hasRedeemFeeHook = false,
		curveRedeemFee = 0n,
	} = context;

	return {
		curveAddresses: async () => curveAddress,
		hasRedeemFeeHook: async () => hasRedeemFeeHook,
		quoteRedeemFee: async () => curveRedeemFee,
	};
}

export function buildPlanMetadata(inputs: {
	module: string;
	method: string;
	label?: string;
	description?: string;
	tags?: string[];
	context?: {
		[key: string]: EnvelopeSerializable;
	};
}): AgentActionMetadata {
	return {
		label: inputs.label,
		description: inputs.description,
		tags: inputs.tags,
		source: {
			package: '@0xintuition/cli',
			module: inputs.module,
			method: inputs.method,
		},
		context: serializeEnvelopeObject(inputs.context),
	};
}

export function buildPlanStep(inputs: {
	id: string;
	intent: AgentActionTargetIntent;
	data: Hex;
	value?: bigint;
	label?: string;
	description?: string;
	tags?: string[];
	context?: {
		[key: string]: EnvelopeSerializable;
	};
}): CreateAgentActionStepInput {
	return {
		id: inputs.id,
		intent: inputs.intent,
		data: inputs.data,
		value: inputs.value === undefined ? undefined : bigintToDecimalString(inputs.value),
		metadata:
			inputs.label || inputs.description || inputs.tags || inputs.context
				? {
						label: inputs.label,
						description: inputs.description,
						tags: inputs.tags,
						context: serializeEnvelopeObject(inputs.context),
					}
				: undefined,
	};
}

export function buildPlanEnvelope(inputs: {
	action: string;
	module: string;
	method: string;
	label?: string;
	description?: string;
	tags?: string[];
	context?: {
		[key: string]: EnvelopeSerializable;
	};
	steps: CreateAgentActionStepInput[];
	estimates?: {
		[key: string]: EnvelopeSerializable;
	};
	warnings?: string[];
}): AgentActionEnvelope {
	return createAgentActionEnvelope({
		action: inputs.action,
		steps: inputs.steps,
		metadata: buildPlanMetadata({
			module: inputs.module,
			method: inputs.method,
			label: inputs.label,
			description: inputs.description,
			tags: inputs.tags,
			context: inputs.context,
		}),
		estimates: serializeEnvelopeObject(inputs.estimates),
		warnings: inputs.warnings,
	});
}
