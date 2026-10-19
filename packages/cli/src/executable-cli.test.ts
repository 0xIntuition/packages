import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const builtCliPath = fileURLToPath(new URL('../dist/bin/intuition.js', import.meta.url));
const bunExecutable = process.versions.bun ? process.execPath : 'bun';
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

function runBun(args: readonly string[], cwd = packageRoot): void {
	execFileSync(bunExecutable, args, {
		cwd,
		stdio: 'inherit',
	});
}

function runCli(args: readonly string[]): string {
	return execFileSync('node', [builtCliPath, ...args], {
		cwd: packageRoot,
		encoding: 'utf8',
	});
}

beforeAll(() => {
	const peripheryDistEntry = resolve(repoRoot, 'packages/periphery/dist/index.js');
	const protocolDistEntry = resolve(repoRoot, 'packages/protocol/dist/index.js');

	if (!existsSync(peripheryDistEntry)) {
		runBun(['run', '--cwd', 'packages/periphery', 'build'], repoRoot);
	}

	if (!existsSync(protocolDistEntry)) {
		runBun(['run', '--cwd', 'packages/protocol', 'build'], repoRoot);
	}

	runBun(['run', 'build:cli']);
}, 30_000);

describe('executable CLI', () => {
	it('prints top-level help', () => {
		const output = runCli(['--help']);

		expect(output).toContain('intuition --help');
		expect(output).toContain('intuition encoders list');
		expect(output).toContain('intuition encode <encoder-name>');
	});

	it('lists encoder catalog entries as JSON', () => {
		const output = runCli([
			'encoders',
			'list',
			'--surface',
			'core',
			'--contract',
			'trust',
			'--json',
		]);
		const entries = JSON.parse(output) as Array<{ encoderName: string; surface: string }>;

		expect(entries.some((entry) => entry.encoderName === 'trustApproveEncode')).toBe(true);
		expect(entries.every((entry) => entry.surface === 'core')).toBe(true);
	});

	it('encodes a representative core command', () => {
		const output = runCli([
			'encode',
			'trustApproveEncode',
			'--args',
			'["0x1111111111111111111111111111111111111111","1000"]',
		]).trim();

		expect(output).toBe(
			'0x095ea7b3000000000000000000000000111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000003e8'
		);
	});

	it('encodes a representative periphery command with machine-readable output', () => {
		const output = runCli([
			'encode',
			'trustSwapAndBridgeRouterBridgeTrustEncode',
			'--args',
			'["1000","0x2222222222222222222222222222222222222222"]',
			'--json',
		]);
		const encoded = JSON.parse(output) as {
			data: string;
			encoderName: string;
			surface: string;
		};

		expect(encoded.encoderName).toBe('trustSwapAndBridgeRouterBridgeTrustEncode');
		expect(encoded.surface).toBe('periphery');
		expect(encoded.data).toBe(
			'0x05cc32ce00000000000000000000000000000000000000000000000000000000000003e80000000000000000000000002222222222222222222222222222222222222222'
		);
	});
});
