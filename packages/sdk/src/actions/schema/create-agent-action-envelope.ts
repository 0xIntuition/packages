import { isAddress, isHex } from 'viem';

import { resolveAgentActionTarget } from './resolve-agent-action-target';
import {
	type AgentActionEnvelope,
	type AgentActionMetadata,
	type AgentActionStep,
	type AgentActionTarget,
	type AgentActionTargetIntent,
	agentActionSchemaVersion,
	type CreateAgentActionStepInput,
	type JsonObject,
} from './types';

export type CreateAgentActionEnvelopeInputs = {
	action: string;
	steps: CreateAgentActionStepInput[];
	metadata?: AgentActionMetadata;
	estimates?: JsonObject;
	warnings?: string[];
};

export function bigintToDecimalString(value: bigint): `${bigint}` {
	return value.toString() as `${bigint}`;
}

function formatStepLabel(step: Partial<Pick<AgentActionStep, 'id'>>, index: number): string {
	if (typeof step.id === 'string' && step.id.trim().length > 0) {
		return `step "${step.id}"`;
	}

	return `step at index ${index}`;
}

function assertNonEmptyString(value: unknown, message: string): asserts value is string {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new Error(message);
	}
}

function assertValidAddress(value: string, message: string): void {
	if (!isAddress(value)) {
		throw new Error(message);
	}
}

function assertValidHex(value: string, message: string): void {
	if (!isHex(value)) {
		throw new Error(message);
	}
}

function assertValidValue(value: string | undefined, message: string): void {
	if (value === undefined) {
		return;
	}

	if (!/^(0|[1-9]\d*)$/.test(value)) {
		throw new Error(message);
	}
}

function getIntentFromTarget(
	target: AgentActionTarget,
	stepLabel: string
): AgentActionTargetIntent {
	switch (target.contract) {
		case 'trust': {
			return {
				chainId: target.chainId,
				contract: 'trust',
			};
		}
		case 'multivault': {
			return {
				chainId: target.chainId,
				contract: 'multivault',
			};
		}
		case 'trustbonding': {
			return {
				chainId: target.chainId,
				contract: 'trustbonding',
			};
		}
		case 'wrapped-trust': {
			return {
				chainId: target.chainId,
				contract: 'wrapped-trust',
			};
		}
		case 'base-emissions-controller': {
			return {
				chainId: target.chainId,
				contract: 'base-emissions-controller',
			};
		}
		case 'satellite-emissions-controller': {
			return {
				chainId: target.chainId,
				contract: 'satellite-emissions-controller',
			};
		}
		case 'base-bridge-asset': {
			if (target.asset === undefined) {
				throw new Error(`${stepLabel} target asset is required for ${target.contract}.`);
			}

			return {
				chainId: target.chainId,
				flow: 'bridge-asset',
				contract: 'base-bridge-asset',
				asset: target.asset,
			};
		}
		case 'trust-swap-and-bridge-router': {
			return {
				chainId: target.chainId,
				contract: 'trust-swap-and-bridge-router',
			};
		}
		case 'meta-native-spoke': {
			return {
				chainId: target.chainId,
				flow: 'meta-bridge',
				contract: target.contract,
			};
		}
		case 'meta-erc20-hub': {
			if (target.asset === undefined) {
				throw new Error(`${stepLabel} target asset is required for ${target.contract}.`);
			}

			return {
				chainId: target.chainId,
				flow: 'meta-bridge',
				contract: 'meta-erc20-hub',
				asset: target.asset,
			};
		}
		case 'meta-erc20-spoke': {
			if (target.asset === undefined) {
				throw new Error(`${stepLabel} target asset is required for ${target.contract}.`);
			}

			return {
				chainId: target.chainId,
				flow: 'meta-bridge',
				contract: 'meta-erc20-spoke',
				asset: target.asset,
			};
		}
		case 'atom-warden': {
			return {
				chainId: target.chainId,
				contract: 'atom-warden',
			};
		}
		case 'dynamic-fee-flat-price-curve': {
			return {
				chainId: target.chainId,
				contract: 'dynamic-fee-flat-price-curve',
				address: target.address,
			};
		}
		case 'fee-proxy': {
			return {
				chainId: target.chainId,
				contract: 'fee-proxy',
				address: target.address,
			};
		}
	}
}

function assertTargetMatchesResolvedTarget(
	step: AgentActionStep,
	stepLabel: string,
	resolvedTarget: AgentActionTarget
): void {
	if (step.target.chainId !== resolvedTarget.chainId) {
		throw new Error(
			`${stepLabel} target chain ID must be ${resolvedTarget.chainId}, received ${step.target.chainId}.`
		);
	}

	if (step.target.surface !== resolvedTarget.surface) {
		throw new Error(
			`${stepLabel} target surface must be "${resolvedTarget.surface}", received "${step.target.surface}".`
		);
	}

	if (step.target.flow !== resolvedTarget.flow) {
		throw new Error(
			`${stepLabel} target flow must be "${resolvedTarget.flow}", received "${step.target.flow}".`
		);
	}

	if (step.target.deploymentName !== resolvedTarget.deploymentName) {
		throw new Error(
			`${stepLabel} target deployment name must be "${resolvedTarget.deploymentName}", received "${step.target.deploymentName}".`
		);
	}

	if (step.target.chainName !== resolvedTarget.chainName) {
		throw new Error(
			`${stepLabel} target chain name must be "${resolvedTarget.chainName}", received "${step.target.chainName}".`
		);
	}

	const resolvedAddress = resolvedTarget.address.toLowerCase();
	if (step.target.address.toLowerCase() !== resolvedAddress) {
		throw new Error(
			`${stepLabel} target address must match the resolved deployment address ${resolvedTarget.address}.`
		);
	}

	if (step.to.toLowerCase() !== resolvedAddress) {
		throw new Error(
			`${stepLabel} to address must match the resolved deployment address ${resolvedTarget.address}.`
		);
	}

	const resolvedTargetAsset = 'asset' in resolvedTarget ? resolvedTarget.asset : undefined;
	const stepTargetAsset = 'asset' in step.target ? step.target.asset : undefined;

	if (resolvedTargetAsset !== undefined && stepTargetAsset !== resolvedTargetAsset) {
		throw new Error(
			`${stepLabel} target asset must be "${resolvedTargetAsset}", received "${stepTargetAsset ?? 'undefined'}".`
		);
	}

	if (resolvedTargetAsset === undefined && stepTargetAsset !== undefined) {
		throw new Error(
			`${stepLabel} target asset is only supported for asset-aware targets (base-bridge-asset, meta-erc20-hub, meta-erc20-spoke).`
		);
	}
}

export function validateAgentActionStep(step: AgentActionStep, index = 0): AgentActionStep {
	const stepLabel = formatStepLabel(step, index);

	assertNonEmptyString(step.id, `${stepLabel} id is required.`);
	assertValidAddress(step.to, `${stepLabel} has an invalid to address: "${step.to}".`);
	assertValidHex(step.data, `${stepLabel} has invalid calldata hex: "${step.data}".`);
	assertValidValue(
		step.value,
		`${stepLabel} has an invalid value "${step.value}". Expected a non-negative bigint string.`
	);

	const resolvedTarget = resolveAgentActionTarget(getIntentFromTarget(step.target, stepLabel));
	assertTargetMatchesResolvedTarget(step, stepLabel, resolvedTarget);

	return {
		...step,
		to: resolvedTarget.address,
		target: resolvedTarget,
	};
}

export function createAgentActionStep(
	input: CreateAgentActionStepInput,
	index = 0
): AgentActionStep {
	const stepLabel = formatStepLabel(input, index);

	if ('intent' in input) {
		assertNonEmptyString(input.id, `${stepLabel} id is required.`);
		assertValidHex(input.data, `${stepLabel} has invalid calldata hex: "${input.data}".`);
		assertValidValue(
			input.value,
			`${stepLabel} has an invalid value "${input.value}". Expected a non-negative bigint string.`
		);

		const target = resolveAgentActionTarget(input.intent);

		return {
			id: input.id,
			to: target.address,
			data: input.data,
			value: input.value,
			target,
			metadata: input.metadata,
		};
	}

	if (!('target' in input) || input.target === undefined) {
		throw new Error(`${stepLabel} must include either an intent or target metadata.`);
	}

	return validateAgentActionStep(input, index);
}

export function validateAgentActionEnvelope(envelope: AgentActionEnvelope): AgentActionEnvelope {
	if (envelope.schemaVersion !== agentActionSchemaVersion) {
		throw new Error(
			`Unsupported agent action schema version "${envelope.schemaVersion}". Expected "${agentActionSchemaVersion}".`
		);
	}

	assertNonEmptyString(envelope.action, 'Agent action envelope action is required.');
	if (!Array.isArray(envelope.steps) || envelope.steps.length === 0) {
		throw new Error('Agent action envelope must include at least one step.');
	}

	return {
		...envelope,
		steps: envelope.steps.map((step, index) => validateAgentActionStep(step, index)),
	};
}

export function createAgentActionEnvelope(
	inputs: CreateAgentActionEnvelopeInputs
): AgentActionEnvelope {
	assertNonEmptyString(inputs.action, 'Agent action envelope action is required.');
	if (!Array.isArray(inputs.steps) || inputs.steps.length === 0) {
		throw new Error('Agent action envelope must include at least one step.');
	}

	return validateAgentActionEnvelope({
		schemaVersion: agentActionSchemaVersion,
		action: inputs.action,
		steps: inputs.steps.map((step, index) => createAgentActionStep(step, index)),
		metadata: inputs.metadata,
		estimates: inputs.estimates,
		warnings: inputs.warnings,
	});
}
