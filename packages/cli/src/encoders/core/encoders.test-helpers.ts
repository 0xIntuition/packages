import * as protocol from '@0xintuition/protocol';
import {
	type Abi,
	type AbiFunction,
	type AbiParameter,
	decodeFunctionData,
	encodeFunctionData,
	isHex,
} from 'viem';
import { expect } from 'vitest';
import type { CoreEncoderManifestEntry } from './types';

const MAX_ARRAY_ITEMS = 2;

const DEFAULT_BYTES = '11';
const DEFAULT_DYNAMIC_BYTES = '0x1234';
const DEFAULT_STRING = 'intuition-cli';

function makeAddress(seed: number): `0x${string}` {
	const raw = (seed + 1).toString(16).padStart(40, '0').slice(-40);
	return `0x${raw}`;
}

function makeBytesN(size: number): `0x${string}` {
	return `0x${DEFAULT_BYTES.repeat(size)}`;
}

function getComponents(parameter: AbiParameter): readonly AbiParameter[] | undefined {
	if ('components' in parameter) {
		return parameter.components;
	}
	return undefined;
}

function buildValue(
	type: string,
	components: readonly AbiParameter[] | undefined,
	seed: number
): unknown {
	const arrayMatch = type.match(/^(.*)\[(\d*)\]$/);
	if (arrayMatch) {
		const innerType = arrayMatch[1] ?? type;
		const fixedLength = arrayMatch[2] ?? '';
		const requestedLength = fixedLength === '' ? MAX_ARRAY_ITEMS : Number.parseInt(fixedLength, 10);
		const length = Number.isFinite(requestedLength)
			? Math.max(0, Math.min(requestedLength, MAX_ARRAY_ITEMS))
			: MAX_ARRAY_ITEMS;

		return Array.from({ length }, (_, index) =>
			buildValue(innerType, components, seed + index + 1)
		);
	}

	if (type === 'tuple') {
		if (!components) {
			return [];
		}
		return components.map((component, index) =>
			buildValue(component.type, getComponents(component), seed + index + 1)
		);
	}

	if (type === 'address' || type === 'function') {
		return makeAddress(seed);
	}

	if (type === 'bool') {
		return seed % 2 === 0;
	}

	if (type === 'string') {
		return `${DEFAULT_STRING}-${seed}`;
	}

	if (type === 'bytes') {
		return DEFAULT_DYNAMIC_BYTES;
	}

	const fixedBytesMatch = type.match(/^bytes(\d+)$/);
	if (fixedBytesMatch) {
		const size = Number.parseInt(fixedBytesMatch[1] ?? '1', 10);
		return makeBytesN(size);
	}

	if (type.startsWith('uint') || type.startsWith('int')) {
		return BigInt(seed + 1);
	}

	throw new Error(`Unsupported ABI parameter type for deterministic fixture generation: ${type}`);
}

export function buildArgsFromAbiFunction(abiFunction: AbiFunction): unknown[] {
	return abiFunction.inputs.map((input, index) =>
		buildValue(input.type, getComponents(input), index + 1)
	);
}

export function getAbiByName(abiName: string): Abi {
	const abi = (protocol as Record<string, unknown>)[abiName];
	if (!Array.isArray(abi)) {
		throw new Error(`ABI export not found for ${abiName}`);
	}

	return abi as Abi;
}

export function getAbiFunction(abi: Abi, functionName: string): AbiFunction {
	const match = abi.find(
		(item): item is AbiFunction => item.type === 'function' && item.name === functionName
	);

	if (!match) {
		throw new Error(`Function ${functionName} not found in ABI`);
	}

	return match;
}

export function assertEncoderRoundTrip(
	encoderModule: Record<string, unknown>,
	manifest: readonly CoreEncoderManifestEntry[]
): void {
	for (const entry of manifest) {
		const maybeEncode = encoderModule[entry.encoderName];
		expect(typeof maybeEncode).toBe('function');

		const encode = maybeEncode as (...args: unknown[]) => `0x${string}`;
		const abi = getAbiByName(entry.abiName);
		const abiFunction = getAbiFunction(abi, entry.functionName);
		const args = buildArgsFromAbiFunction(abiFunction);

		const calldata = encode(...args);
		expect(isHex(calldata)).toBe(true);
		expect(calldata.length).toBeGreaterThanOrEqual(10);

		const decoded = decodeFunctionData({
			abi,
			data: calldata,
		});

		expect(decoded.functionName).toBe(entry.functionName);

		const reEncoded = encodeFunctionData({
			abi,
			functionName: decoded.functionName,
			args: decoded.args,
		});
		expect(reEncoded).toBe(calldata);
	}
}
