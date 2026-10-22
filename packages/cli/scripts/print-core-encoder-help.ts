import {
	type CoreEncoderContract,
	type CoreEncoderKind,
	formatCoreEncoderHelp,
} from '../src/encoders/core';

function parseOption(prefix: string): string | undefined {
	for (const arg of Bun.argv.slice(2)) {
		if (arg.startsWith(`${prefix}=`)) {
			return arg.slice(prefix.length + 1);
		}
	}
	return undefined;
}

const contractInput = parseOption('--contract');
const kindInput = parseOption('--kind');
const includeMethods = !Bun.argv.includes('--summary');

const contract = contractInput as CoreEncoderContract | undefined;
const kind = kindInput as CoreEncoderKind | undefined;

console.log(
	formatCoreEncoderHelp({
		contract,
		kind,
		includeMethods,
	})
);
