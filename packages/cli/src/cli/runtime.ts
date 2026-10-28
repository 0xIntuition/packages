import { parseArgs } from 'node:util';
import type { AbiParameter } from 'viem';

import { type EncoderSurface, formatEncoderHelp, getEncoderByName, listEncoders } from './registry';

type CommandIo = {
	write(message: string): void;
	writeError(message: string): void;
};

const defaultIo: CommandIo = {
	write(message) {
		process.stdout.write(`${message}\n`);
	},
	writeError(message) {
		process.stderr.write(`${message}\n`);
	},
};

const usageText = [
	'Usage:',
	'  intuition --help',
	'  intuition encoders list [--surface <core|periphery|all>] [--contract <name>] [--kind <read|write>] [--json]',
	"  intuition encode <encoder-name> --args '[...]' [--json]",
	'',
	'Examples:',
	'  intuition encoders list --surface core --contract trust --kind write',
	'  intuition encode trustApproveEncode --args \'["0x1111111111111111111111111111111111111111", "1000"]\'',
].join('\n');

function parseBooleanFlag(value: unknown): boolean {
	return value === true;
}

function getArrayMatch(type: string): RegExpMatchArray | null {
	return type.match(/^(.*)\[(\d*)\]$/);
}

function coerceIntegerValue(type: string, value: unknown): bigint {
	if (typeof value === 'bigint') {
		return value;
	}

	if (typeof value === 'number') {
		if (!Number.isSafeInteger(value)) {
			throw new Error(`Expected a safe integer for ${type}.`);
		}
		return BigInt(value);
	}

	if (typeof value === 'string' && /^-?\d+$/.test(value)) {
		return BigInt(value);
	}

	throw new Error(`Expected a decimal integer for ${type}.`);
}

function coerceAbiValue(parameter: AbiParameter, value: unknown): unknown {
	const arrayMatch = getArrayMatch(parameter.type);
	if (arrayMatch) {
		if (!Array.isArray(value)) {
			throw new Error(`Expected an array for ${parameter.type}.`);
		}

		const innerType = arrayMatch[1] ?? parameter.type;
		const fixedLength = arrayMatch[2] ?? '';
		if (fixedLength !== '') {
			const expectedLength = Number.parseInt(fixedLength, 10);
			if (value.length !== expectedLength) {
				throw new Error(`Expected ${expectedLength} items for ${parameter.type}.`);
			}
		}

		return value.map((item) =>
			coerceAbiValue(
				{
					...parameter,
					type: innerType,
				},
				item
			)
		);
	}

	if (parameter.type === 'tuple') {
		if (!Array.isArray(value)) {
			throw new Error('Expected a JSON array for tuple arguments.');
		}

		const components = 'components' in parameter ? (parameter.components ?? []) : [];
		if (value.length !== components.length) {
			throw new Error(`Expected ${components.length} tuple items but received ${value.length}.`);
		}

		return components.map((component, index) => coerceAbiValue(component, value[index]));
	}

	if (parameter.type === 'bool') {
		if (typeof value !== 'boolean') {
			throw new Error('Expected a boolean value.');
		}
		return value;
	}

	if (parameter.type === 'string') {
		if (typeof value !== 'string') {
			throw new Error('Expected a string value.');
		}
		return value;
	}

	if (
		parameter.type === 'address' ||
		parameter.type === 'function' ||
		parameter.type.startsWith('bytes')
	) {
		if (typeof value !== 'string') {
			throw new Error(`Expected a string value for ${parameter.type}.`);
		}
		return value;
	}

	if (parameter.type.startsWith('uint') || parameter.type.startsWith('int')) {
		const integerValue = coerceIntegerValue(parameter.type, value);
		if (parameter.type.startsWith('uint') && integerValue < 0n) {
			throw new Error(`Expected a non-negative integer for ${parameter.type}.`);
		}
		return integerValue;
	}

	throw new Error(`Unsupported ABI parameter type: ${parameter.type}.`);
}

function parseJsonArray(rawArgs: string): unknown[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(rawArgs);
	} catch {
		throw new Error('`--args` must be valid JSON.');
	}

	if (!Array.isArray(parsed)) {
		throw new Error('`--args` must be a JSON array.');
	}

	return parsed;
}

function formatEncodeError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Unknown CLI error.';
}

function renderEncodeHelp(encoderName?: string): string {
	return [
		'Usage:',
		"  intuition encode <encoder-name> --args '[...]' [--json]",
		'',
		encoderName
			? `Encoder: ${encoderName}`
			: 'Pass an encoder name from `intuition encoders list`.',
	].join('\n');
}

async function handleListCommand(args: string[], io: CommandIo): Promise<number> {
	const parsed = parseArgs({
		args,
		allowPositionals: true,
		options: {
			contract: { type: 'string' },
			json: { type: 'boolean' },
			kind: { type: 'string' },
			surface: { type: 'string' },
		},
		strict: true,
	});

	const surface = (parsed.values.surface as EncoderSurface | 'all' | undefined) ?? 'all';
	const entries = listEncoders({
		surface,
		contract: parsed.values.contract,
		kind: parsed.values.kind,
	});

	if (parseBooleanFlag(parsed.values.json)) {
		io.write(JSON.stringify(entries, null, 2));
		return 0;
	}

	io.write(
		formatEncoderHelp({
			surface,
			contract: parsed.values.contract,
			kind: parsed.values.kind,
			includeMethods: true,
		})
	);
	return 0;
}

async function handleEncodersCommand(args: string[], io: CommandIo): Promise<number> {
	const [subcommand, ...rest] = args;
	if (!subcommand || subcommand === 'list') {
		return handleListCommand(rest, io);
	}

	io.writeError(`Unknown encoders subcommand: ${subcommand}`);
	io.writeError(
		'Usage: intuition encoders list [--surface ...] [--contract ...] [--kind ...] [--json]'
	);
	return 1;
}

async function handleEncodeCommand(args: string[], io: CommandIo): Promise<number> {
	const [encoderName, ...rest] = args;
	if (!encoderName || encoderName === '--help') {
		io.write(renderEncodeHelp());
		return encoderName ? 0 : 1;
	}

	const parsed = parseArgs({
		args: rest,
		allowPositionals: true,
		options: {
			args: { type: 'string' },
			json: { type: 'boolean' },
		},
		strict: true,
	});

	const runtimeEntry = getEncoderByName(encoderName);
	if (!runtimeEntry) {
		io.writeError(`Unknown encoder: ${encoderName}`);
		io.writeError(renderEncodeHelp(encoderName));
		return 1;
	}

	if (!parsed.values.args) {
		io.writeError('Missing required `--args` option.');
		io.writeError(renderEncodeHelp(encoderName));
		return 1;
	}

	try {
		const rawArgs = parseJsonArray(parsed.values.args);
		if (rawArgs.length !== runtimeEntry.abiFunction.inputs.length) {
			throw new Error(
				`Expected ${runtimeEntry.abiFunction.inputs.length} arguments but received ${rawArgs.length}.`
			);
		}

		const coercedArgs = runtimeEntry.abiFunction.inputs.map((input, index) =>
			coerceAbiValue(input, rawArgs[index])
		);
		const data = runtimeEntry.encode(...coercedArgs);

		if (parseBooleanFlag(parsed.values.json)) {
			io.write(
				JSON.stringify(
					{
						contract: runtimeEntry.contract,
						data,
						encoderName: runtimeEntry.encoderName,
						functionName: runtimeEntry.functionName,
						kind: runtimeEntry.kind,
						surface: runtimeEntry.surface,
					},
					null,
					2
				)
			);
			return 0;
		}

		io.write(data);
		return 0;
	} catch (error) {
		io.writeError(formatEncodeError(error));
		io.writeError(renderEncodeHelp(encoderName));
		return 1;
	}
}

export async function runCli(argv: readonly string[], io: CommandIo = defaultIo): Promise<number> {
	try {
		const [command, ...rest] = argv;

		if (!command || command === '--help' || command === 'help') {
			io.write(usageText);
			return 0;
		}

		if (command === 'encoders') {
			return handleEncodersCommand(rest, io);
		}

		if (command === 'encode') {
			return handleEncodeCommand(rest, io);
		}

		io.writeError(`Unknown command: ${command}`);
		io.writeError(usageText);
		return 1;
	} catch (error) {
		io.writeError(formatEncodeError(error));
		return 1;
	}
}
