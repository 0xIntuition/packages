import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import type { Abi, AbiParameter } from 'viem';
import { describe, expect, it } from 'vitest';

import { MultiVaultAbi } from './MultiVault-abi.js';
import { MultiVaultMigrationModeAbi } from './MultiVaultMigrationMode-abi.js';

// contracts-v2 is a root devDependency, not a protocol dependency. Resolve its
// installed dist module from the repository root without adding a manifest pin.
const rootRequire = createRequire(new URL('../../../../package.json', import.meta.url));
const sourceRoot = resolve(rootRequire.resolve('@0xintuition/contracts-v2/package.json'), '..');
const installed = rootRequire(resolve(sourceRoot, 'dist/abis/index.js')) as {
	MultiVaultAbi: Abi;
	MultiVaultMigrationModeAbi: Abi;
};

type SemanticItem = Extract<Abi[number], { type: 'function' | 'event' | 'error' }>;
type Parameter = AbiParameter & { indexed?: boolean; components?: readonly Parameter[] };

function parameters(
	actual: readonly Parameter[],
	expected: readonly Parameter[],
	indexed = false
): [unknown[], unknown[]] {
	function project(input: Parameter, peer: Parameter | undefined): unknown {
		return {
			name: input.name,
			type: input.type,
			...(indexed ? { indexed: input.indexed } : {}),
			...(input.internalType !== undefined && peer?.internalType !== undefined
				? { internalType: input.internalType }
				: {}),
			...(input.components
				? { components: input.components.map((part, i) => project(part, peer?.components?.[i])) }
				: {}),
		};
	}
	return [
		actual.map((input, i) => project(input, expected[i])),
		expected.map((input, i) => project(input, actual[i])),
	];
}

function semanticMismatches(actual: Abi, expected: Abi): string[] {
	const supported = (item: Abi[number]): item is SemanticItem =>
		item.type === 'function' || item.type === 'event' || item.type === 'error';
	const key = (item: SemanticItem) => `${item.type} ${item.name}`;
	function group(abi: Abi) {
		const groups = new Map<string, SemanticItem[]>();
		for (const item of abi.filter(supported)) {
			const name = key(item);
			groups.set(name, [...(groups.get(name) ?? []), item]);
		}
		return groups;
	}
	const actualGroups = group(actual);
	const expectedGroups = group(expected);
	const mismatches: string[] = [];
	for (const name of new Set([...actualGroups.keys(), ...expectedGroups.keys()])) {
		const left = actualGroups.get(name) ?? [];
		const right = expectedGroups.get(name) ?? [];
		if (left.length !== right.length) {
			mismatches.push(`${name}: item count ${left.length} != ${right.length}`);
			continue;
		}
		// Match overloads by recursive parameter types so ABI item order is immaterial.
		const signature = (item: SemanticItem) =>
			JSON.stringify(
				item.inputs.map(function types(input): unknown {
					return {
						type: input.type,
						...('components' in input ? { components: input.components.map(types) } : {}),
					};
				})
			);
		const sort = (items: SemanticItem[]) =>
			[...items].sort((a, b) => signature(a).localeCompare(signature(b)));
		const sortedLeft = sort(left);
		const sortedRight = sort(right);
		for (let i = 0; i < sortedLeft.length; i++) {
			const a = sortedLeft[i]!;
			const b = sortedRight[i]!;
			const inputs = parameters(a.inputs, b.inputs, a.type === 'event');
			const project = (item: SemanticItem, inputs: unknown[]) => ({
				type: item.type,
				name: item.name,
				inputs,
				...(item.type === 'event' ? { anonymous: item.anonymous } : {}),
				...(item.type === 'function' ? { stateMutability: item.stateMutability } : {}),
			});
			const outputs =
				a.type === 'function' && b.type === 'function'
					? parameters(a.outputs, b.outputs)
					: [[], []];
			if (
				JSON.stringify([project(a, inputs[0]), outputs[0]]) !==
				JSON.stringify([project(b, inputs[1]), outputs[1]])
			) {
				mismatches.push(`${name}: semantic mismatch (inputs/outputs/indexed/mutability/anonymous)`);
			}
		}
	}
	return mismatches;
}

describe('installed contracts-v2 semantic ABI parity', () => {
	it.each([
		['MultiVault', MultiVaultAbi, installed.MultiVaultAbi],
		['MultiVaultMigrationMode', MultiVaultMigrationModeAbi, installed.MultiVaultMigrationModeAbi],
	] as const)('%s matches every function, event, and error', (_name, shipped, source) => {
		expect(semanticMismatches(shipped, source)).toEqual([]);
	});

	it('pins termId and registrant indexing and the fourth bytes[][] argument', () => {
		for (const abi of [
			MultiVaultAbi,
			installed.MultiVaultAbi,
			MultiVaultMigrationModeAbi,
			installed.MultiVaultMigrationModeAbi,
		]) {
			const context = abi.find(
				(item) => item.type === 'event' && item.name === 'AtomContextRegistered'
			);
			expect(context?.type).toBe('event');
			if (context?.type !== 'event') throw new Error('AtomContextRegistered missing');
			expect(context.inputs.map((input) => [input.name, input.indexed])).toEqual([
				['termId', true],
				['registrant', true],
				['uris', false],
			]);
			const write = abi.find(
				(item) => item.type === 'function' && item.name === 'createAtomsWithUris'
			);
			expect(write?.type).toBe('function');
			if (write?.type !== 'function') throw new Error('createAtomsWithUris missing');
			expect(write.inputs[3]).toMatchObject({ name: 'uris', type: 'bytes[][]' });
		}
	});
});
