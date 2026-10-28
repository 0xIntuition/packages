/** Offline drift check. Passing this does NOT certify npm or deployed-contract parity. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as abis from '../packages/deployments/src/abis/index';
import * as bytecode from '../packages/deployments/src/bytecode/index';
import { contractsV2Provenance } from '../packages/protocol/src/contracts/contracts-v2-provenance';

export const fingerprint = (value: unknown) =>
	createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function assertArtifactFingerprints(
	artifacts: Record<string, unknown>,
	expected: Record<string, string>
) {
	const actual = Object.fromEntries(
		Object.entries(artifacts)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([name, value]) => [name, fingerprint(value)])
	);
	assert.deepEqual(
		actual,
		expected,
		'Candidate contract artifacts changed; review the source revision and refresh contract-artifacts.json explicitly.'
	);
}

export function checkCandidateArtifacts() {
	const record = JSON.parse(
		readFileSync(new URL('../contract-artifacts.json', import.meta.url), 'utf8')
	);
	assertArtifactFingerprints({ ...abis, ...bytecode }, record.fingerprints);
	for (const [field, value] of Object.entries({
		abiFingerprint: abis.MultiVaultAbi,
		migrationModeAbiFingerprint: abis.MultiVaultMigrationModeAbi,
		bytecodeFingerprint: bytecode.MultiVaultBytecode,
		migrationModeBytecodeFingerprint: bytecode.MultiVaultMigrationModeBytecode,
	})) {
		assert.equal(
			contractsV2Provenance[field as keyof typeof contractsV2Provenance],
			fingerprint(value),
			`Stale provenance: ${field}`
		);
	}
	console.log(
		'Candidate ABI/bytecode fingerprints match. Run release:check for authoritative npm parity; this offline check is not release approval.'
	);
}

if (import.meta.main) checkCandidateArtifacts();
