import {
	type CoreEncoderContract,
	type CoreEncoderKind,
	formatCoreEncoderHelp,
} from '../src/encoders/core';
import {
	formatPeripheryEncoderHelp,
	type PeripheryEncoderContract,
	type PeripheryEncoderKind,
} from '../src/encoders/periphery';

type EncoderSurface = 'core' | 'periphery' | 'all';

function parseOption(prefix: string): string | undefined {
	for (const arg of Bun.argv.slice(2)) {
		if (arg.startsWith(`${prefix}=`)) {
			return arg.slice(prefix.length + 1);
		}
	}
	return undefined;
}

const surfaceInput = parseOption('--surface');
const contractInput = parseOption('--contract');
const kindInput = parseOption('--kind');
const includeMethods = !Bun.argv.includes('--summary');

const surface = (surfaceInput as EncoderSurface | undefined) ?? 'all';

function renderSurfaceHelp(targetSurface: EncoderSurface): string {
	if (targetSurface === 'core') {
		return formatCoreEncoderHelp({
			contract: contractInput as CoreEncoderContract | undefined,
			kind: kindInput as CoreEncoderKind | undefined,
			includeMethods,
		});
	}

	if (targetSurface === 'periphery') {
		return formatPeripheryEncoderHelp({
			contract: contractInput as PeripheryEncoderContract | undefined,
			kind: kindInput as PeripheryEncoderKind | undefined,
			includeMethods,
		});
	}

	return [
		formatCoreEncoderHelp({
			contract: contractInput as CoreEncoderContract | undefined,
			kind: kindInput as CoreEncoderKind | undefined,
			includeMethods,
		}),
		'',
		formatPeripheryEncoderHelp({
			contract: contractInput as PeripheryEncoderContract | undefined,
			kind: kindInput as PeripheryEncoderKind | undefined,
			includeMethods,
		}),
	].join('\n');
}

console.log(renderSurfaceHelp(surface));
