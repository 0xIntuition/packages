/** Release-only gate: CI's MultiVault check does not cover every imported contract. */
import * as publishedAbis from '@0xintuition/contracts-v2/abis';
import * as publishedBytecodes from '@0xintuition/contracts-v2/bytecodes';
import * as periphery from '../packages/periphery/src/contracts';
import * as protocol from '../packages/protocol/src/contracts';

const source = { ...publishedAbis, ...publishedBytecodes } as Record<string, unknown>;
const shipped = { ...protocol, ...periphery } as Record<string, unknown>;
const failures: string[] = [];
for (const contract of [
	'MultiVault',
	'MultiVaultMigrationMode',
	'AtomWarden',
	'DynamicFeeFlatPriceCurve',
	'FeeProxy',
	'TrustSwapAndBridgeRouter',
]) {
	for (const suffix of ['Abi', 'Bytecode']) {
		const name = `${contract}${suffix}`;
		if (!source[name])
			failures.push(
				`${name}: absent from the pinned contracts artifact; an authoritative source is required`
			);
		else if (JSON.stringify(source[name]) !== JSON.stringify(shipped[name]))
			failures.push(`${name}: differs from the pinned contracts artifact`);
	}
}
if (failures.length)
	throw new Error(
		`Contract release gate failed:\n${failures.join('\n')}\nSee docs/release-readiness.md. Do not overwrite artifacts without resolving the intended contract revision.`
	);
console.log('Release contract artifacts match the pinned source.');
