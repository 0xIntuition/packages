import { feeProxyEncoderManifest } from './fee-proxy';
import { metaBridgeEncoderManifest } from './meta-bridge';
import { trustSwapAndBridgeRouterEncoderManifest } from './trust-swap-and-bridge-router';
import type {
	PeripheryEncoderContract,
	PeripheryEncoderKind,
	PeripheryEncoderManifestEntry,
} from './types';

export type PeripheryEncoderListOptions = {
	contract?: PeripheryEncoderContract;
	kind?: PeripheryEncoderKind;
	query?: string;
};

export type PeripheryEncoderHelpOptions = PeripheryEncoderListOptions & {
	includeMethods?: boolean;
};

const contractOrder: readonly PeripheryEncoderContract[] = [
	'trust-swap-and-bridge-router',
	'meta-bridge',
	'fee-proxy',
] as const;

export const peripheryEncoderCatalog: readonly PeripheryEncoderManifestEntry[] = [
	...trustSwapAndBridgeRouterEncoderManifest,
	...metaBridgeEncoderManifest,
	...feeProxyEncoderManifest,
];

export function listPeripheryEncoderContracts(): readonly PeripheryEncoderContract[] {
	return contractOrder;
}

export function listPeripheryEncoders(
	options: PeripheryEncoderListOptions = {}
): PeripheryEncoderManifestEntry[] {
	const { contract, kind, query } = options;
	const normalizedQuery = query?.trim().toLowerCase();

	return peripheryEncoderCatalog.filter((entry) => {
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

export function countPeripheryEncodersByContract(
	options: Pick<PeripheryEncoderListOptions, 'kind'> = {}
): Record<PeripheryEncoderContract, number> {
	const { kind } = options;
	const entries = listPeripheryEncoders({ kind });
	const counts: Record<PeripheryEncoderContract, number> = {
		'trust-swap-and-bridge-router': 0,
		'meta-bridge': 0,
		'fee-proxy': 0,
	};

	for (const entry of entries) {
		counts[entry.contract] += 1;
	}

	return counts;
}

export function formatPeripheryEncoderHelp(options: PeripheryEncoderHelpOptions = {}): string {
	const { contract, kind, includeMethods = false } = options;
	const entries = listPeripheryEncoders({ contract, kind });
	const counts = countPeripheryEncodersByContract({ kind });

	const header = [
		'Periphery encoder catalog',
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
