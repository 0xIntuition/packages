import { atomWardenEncoderManifest } from './atom-warden';
import { baseEmissionsControllerEncoderManifest } from './base-emissions-controller';
import { dynamicFeeFlatPriceCurveEncoderManifest } from './dynamic-fee-flat-price-curve';
import { multivaultEncoderManifest } from './multivault';
import { satelliteEmissionsControllerEncoderManifest } from './satellite-emissions-controller';
import { trustEncoderManifest } from './trust';
import { trustbondingEncoderManifest } from './trustbonding';
import type { CoreEncoderContract, CoreEncoderKind, CoreEncoderManifestEntry } from './types';
import { wrappedTrustEncoderManifest } from './wrapped-trust';

export type CoreEncoderListOptions = {
	contract?: CoreEncoderContract;
	kind?: CoreEncoderKind;
	query?: string;
};

export type CoreEncoderHelpOptions = CoreEncoderListOptions & {
	includeMethods?: boolean;
};

const contractOrder: readonly CoreEncoderContract[] = [
	'multivault',
	'trust',
	'trustbonding',
	'wrapped-trust',
	'base-emissions-controller',
	'satellite-emissions-controller',
	'dynamic-fee-flat-price-curve',
	'atom-warden',
] as const;

export const coreEncoderCatalog: readonly CoreEncoderManifestEntry[] = [
	...multivaultEncoderManifest,
	...trustEncoderManifest,
	...trustbondingEncoderManifest,
	...wrappedTrustEncoderManifest,
	...baseEmissionsControllerEncoderManifest,
	...satelliteEmissionsControllerEncoderManifest,
	...dynamicFeeFlatPriceCurveEncoderManifest,
	...atomWardenEncoderManifest,
];

export function listCoreEncoderContracts(): readonly CoreEncoderContract[] {
	return contractOrder;
}

export function listCoreEncoders(options: CoreEncoderListOptions = {}): CoreEncoderManifestEntry[] {
	const { contract, kind, query } = options;
	const normalizedQuery = query?.trim().toLowerCase();

	return coreEncoderCatalog.filter((entry) => {
		if (contract && entry.contract !== contract) {
			return false;
		}
		if (kind && entry.kind !== kind) {
			return false;
		}
		if (!normalizedQuery) {
			return true;
		}

		return (
			entry.encoderName.toLowerCase().includes(normalizedQuery) ||
			entry.functionName.toLowerCase().includes(normalizedQuery) ||
			entry.sourceWrapper.toLowerCase().includes(normalizedQuery)
		);
	});
}

export function countCoreEncodersByContract(
	options: Pick<CoreEncoderListOptions, 'kind'> = {}
): Record<CoreEncoderContract, number> {
	const { kind } = options;
	const entries = listCoreEncoders({ kind });
	const counts: Record<CoreEncoderContract, number> = {
		multivault: 0,
		trust: 0,
		trustbonding: 0,
		'wrapped-trust': 0,
		'base-emissions-controller': 0,
		'satellite-emissions-controller': 0,
		'dynamic-fee-flat-price-curve': 0,
		'atom-warden': 0,
	};

	for (const entry of entries) {
		counts[entry.contract] += 1;
	}

	return counts;
}

export function formatCoreEncoderHelp(options: CoreEncoderHelpOptions = {}): string {
	const { contract, kind, includeMethods = false } = options;
	const entries = listCoreEncoders({ contract, kind });
	const counts = countCoreEncodersByContract({ kind });

	const header = [
		'Core encoder catalog',
		`Total: ${entries.length}`,
		`Filter contract: ${contract ?? 'all'}`,
		`Filter kind: ${kind ?? 'all'}`,
	];

	const lines = [...header, '', 'Contracts:'];
	for (const contractKey of contractOrder) {
		if (contract && contractKey !== contract) {
			continue;
		}
		const contractEntries = entries.filter((entry) => entry.contract === contractKey);
		const readCount = contractEntries.filter((entry) => entry.kind === 'read').length;
		const writeCount = contractEntries.filter((entry) => entry.kind === 'write').length;
		lines.push(
			`- ${contractKey}: total=${counts[contractKey]} read=${readCount} write=${writeCount}`
		);
	}

	if (includeMethods) {
		lines.push('', 'Methods:');
		for (const entry of entries) {
			lines.push(
				`- [${entry.contract}] [${entry.kind}] ${entry.encoderName} -> ${entry.functionName}`
			);
		}
	}

	return lines.join('\n');
}
