import { spawnSync } from 'node:child_process';
import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type Address, isAddress } from 'viem';

const LOCK_TIMEOUT_MS = 180_000;
const LOCK_RETRY_MS = 250;
const STALE_LOCK_MS = 10 * 60_000;
const ANVIL_CHAIN_ID_HEX = '0x7a69';
const ANVIL_PROXY_HOST = process.env.VITEST_ANVIL_PROXY_HOST ?? '127.0.0.1';
const ANVIL_PROXY_PORT = Number.parseInt(process.env.VITEST_ANVIL_PROXY_PORT ?? '8545', 10);

type CoreAnvilAddresses = {
	rpcUrl?: string;
	trustToken?: string;
	wrappedTrust?: string;
	intuition?: {
		multiVault?: string;
		trustBonding?: string;
		bondingCurveRegistry?: string;
		linearCurve?: string;
		satelliteEmissionsController?: string;
		atomWalletFactory?: string;
		atomWarden?: string;
	};
};

export type CoreDeployment = {
	rpcUrl: string;
	trustToken: Address;
	wrappedTrust?: Address;
	intuition: {
		multiVault: Address;
		trustBonding: Address;
		bondingCurveRegistry: Address;
		linearCurve: Address;
		satelliteEmissionsController: Address;
		atomWalletFactory: Address;
		atomWarden: Address;
	};
};

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(MODULE_DIR, '../../../../');
const CORE_DIR = resolve(REPO_ROOT, 'contracts/core');
const CACHE_DIR = resolve(REPO_ROOT, 'intuition/protocol/.cache');
const workerId = process.env.VITEST_POOL_ID ?? '1';
const workerFoundryDir = resolve(CACHE_DIR, `foundry-worker-${workerId}`);
const workerFoundryBroadcastDir = resolve(workerFoundryDir, 'broadcast');
const workerFoundryCacheDir = resolve(workerFoundryDir, 'cache');
const exportJsonPath = resolve(CACHE_DIR, `anvil-core-addresses-${workerId}.json`);
const exportEnvPath = resolve(CACHE_DIR, `anvil-core-addresses-${workerId}.env`);
const deployLockPath = resolve(CACHE_DIR, `anvil-core-deploy-${workerId}.lock`);

let deployPromise: Promise<CoreDeployment> | undefined;

function sleep(ms: number): Promise<void> {
	return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function requireAddress(value: string | undefined, label: string): Address {
	if (!value || !isAddress(value)) {
		throw new Error(`Invalid ${label} in ${exportJsonPath}: ${String(value)}`);
	}
	return value;
}

function parseDeployment(payload: CoreAnvilAddresses): CoreDeployment {
	if (!payload.rpcUrl) {
		throw new Error(`Missing rpcUrl in ${exportJsonPath}`);
	}

	const intuition = payload.intuition;
	if (!intuition) {
		throw new Error(`Missing intuition deployment block in ${exportJsonPath}`);
	}

	const wrappedTrust =
		payload.wrappedTrust && isAddress(payload.wrappedTrust)
			? (payload.wrappedTrust as Address)
			: undefined;

	return {
		rpcUrl: payload.rpcUrl,
		trustToken: requireAddress(payload.trustToken, 'trustToken'),
		wrappedTrust,
		intuition: {
			multiVault: requireAddress(intuition.multiVault, 'intuition.multiVault'),
			trustBonding: requireAddress(intuition.trustBonding, 'intuition.trustBonding'),
			bondingCurveRegistry: requireAddress(
				intuition.bondingCurveRegistry,
				'intuition.bondingCurveRegistry'
			),
			linearCurve: requireAddress(intuition.linearCurve, 'intuition.linearCurve'),
			satelliteEmissionsController: requireAddress(
				intuition.satelliteEmissionsController,
				'intuition.satelliteEmissionsController'
			),
			atomWalletFactory: requireAddress(intuition.atomWalletFactory, 'intuition.atomWalletFactory'),
			atomWarden: requireAddress(intuition.atomWarden, 'intuition.atomWarden'),
		},
	};
}

function applyDeploymentEnv(deployment: CoreDeployment) {
	process.env.ANVIL_RPC_URL = deployment.rpcUrl;
	process.env.ANVIL_MULTIVAULT = deployment.intuition.multiVault;
	process.env.ANVIL_TRUST_BONDING = deployment.intuition.trustBonding;
	process.env.ANVIL_TRUST_TOKEN = deployment.trustToken;
}

async function isRpcHealthy(rpcUrl: string): Promise<boolean> {
	try {
		const response = await fetch(rpcUrl, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'eth_chainId',
				params: [],
			}),
		});

		if (!response.ok) {
			return false;
		}

		const data = (await response.json()) as { result?: string };
		return data.result === ANVIL_CHAIN_ID_HEX;
	} catch {
		return false;
	}
}

async function hasContractCode(rpcUrl: string, address: Address): Promise<boolean> {
	try {
		const response = await fetch(rpcUrl, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'eth_getCode',
				params: [address, 'latest'],
			}),
		});

		if (!response.ok) {
			return false;
		}

		const data = (await response.json()) as { result?: string };
		return typeof data.result === 'string' && data.result !== '0x';
	} catch {
		return false;
	}
}

function readExportedDeployment(): CoreDeployment | undefined {
	if (!existsSync(exportJsonPath)) {
		return undefined;
	}

	try {
		const payload = JSON.parse(readFileSync(exportJsonPath, 'utf8')) as CoreAnvilAddresses;
		return parseDeployment(payload);
	} catch {
		return undefined;
	}
}

async function hasRequiredCode(deployment: CoreDeployment): Promise<boolean> {
	return (
		(await hasContractCode(deployment.rpcUrl, deployment.intuition.multiVault)) &&
		(await hasContractCode(deployment.rpcUrl, deployment.intuition.trustBonding))
	);
}

async function tryReuseExistingDeployment(rpcUrl: string): Promise<CoreDeployment | undefined> {
	if (!(await isRpcHealthy(rpcUrl))) {
		return undefined;
	}

	const deployment = readExportedDeployment();
	if (!deployment) {
		return undefined;
	}

	if (!(await hasRequiredCode(deployment))) {
		return undefined;
	}

	applyDeploymentEnv(deployment);
	return deployment;
}

async function acquireDeployLock(): Promise<() => void> {
	mkdirSync(CACHE_DIR, { recursive: true });
	const startedAt = Date.now();

	while (true) {
		try {
			const fd = openSync(deployLockPath, 'wx');
			writeFileSync(fd, `${process.pid}\n`, 'utf8');

			return () => {
				closeSync(fd);
				rmSync(deployLockPath, { force: true });
			};
		} catch (error) {
			const err = error as NodeJS.ErrnoException;

			if (err.code !== 'EEXIST') {
				throw err;
			}

			if (Date.now() - startedAt > LOCK_TIMEOUT_MS) {
				throw new Error(`Timed out waiting for deploy lock at ${deployLockPath}`);
			}

			try {
				const lockAgeMs = Date.now() - statSync(deployLockPath).mtimeMs;
				if (lockAgeMs > STALE_LOCK_MS) {
					rmSync(deployLockPath, { force: true });
				}
			} catch {
				// Lock disappeared while checking staleness.
			}

			await sleep(LOCK_RETRY_MS);
		}
	}
}

async function runCoreDeployment(): Promise<CoreDeployment> {
	const rpcUrl =
		process.env.ANVIL_RPC_URL?.trim() ||
		`http://${ANVIL_PROXY_HOST}:${ANVIL_PROXY_PORT}/${workerId}`;
	const reusedBeforeLock = await tryReuseExistingDeployment(rpcUrl);
	if (reusedBeforeLock) {
		return reusedBeforeLock;
	}

	const releaseLock = await acquireDeployLock();

	try {
		const reusedAfterLock = await tryReuseExistingDeployment(rpcUrl);
		if (reusedAfterLock) {
			return reusedAfterLock;
		}

		if (!(await isRpcHealthy(rpcUrl))) {
			throw new Error(
				`Expected Anvil RPC at ${rpcUrl}, but it was not reachable. Run tests with \`vitest -c intuition/protocol/vitest.integration.config.ts\` (or \`bun run test\` in intuition/protocol) so global setup starts the test Anvil proxy.`
			);
		}

		mkdirSync(workerFoundryBroadcastDir, { recursive: true });

		const forgeEnv: Record<string, string> = {
			...process.env,
			ANVIL_RPC_URL: rpcUrl,
			ANVIL_EXPORT_JSON_PATH: exportJsonPath,
			ANVIL_EXPORT_ENV_PATH: exportEnvPath,
			FOUNDRY_BROADCAST: workerFoundryBroadcastDir,
			ANVIL_CORE_FAST_MODE: process.env.PROTOCOL_TEST_CORE_FAST_MODE ?? '1',
			ANVIL_CORE_SKIP_SIMULATION: process.env.PROTOCOL_TEST_CORE_SKIP_SIMULATION ?? '1',
			ANVIL_CORE_USE_SLOW: process.env.PROTOCOL_TEST_CORE_USE_SLOW ?? '0',
			ANVIL_CORE_VERBOSE: process.env.PROTOCOL_TEST_CORE_VERBOSE ?? '0',
			ANVIL_CORE_INLINE_TRUST_DEPLOY: process.env.PROTOCOL_TEST_CORE_INLINE_TRUST_DEPLOY ?? '1',
		};
		if (process.env.PROTOCOL_TEST_ISOLATE_FOUNDRY_CACHE === '1') {
			mkdirSync(workerFoundryCacheDir, { recursive: true });
			forgeEnv.FOUNDRY_CACHE_PATH = workerFoundryCacheDir;
		}

		const result = spawnSync('bun', ['run', 'setup:anvil:core'], {
			cwd: CORE_DIR,
			env: forgeEnv,
			encoding: 'utf8',
			stdio: 'pipe',
		});

		if (result.status !== 0) {
			const details = [
				`Failed to deploy core contracts for tests (exit=${result.status}).`,
				result.stdout ? `stdout:\n${result.stdout}` : '',
				result.stderr ? `stderr:\n${result.stderr}` : '',
			]
				.filter(Boolean)
				.join('\n\n');
			throw new Error(details);
		}

		const payload = JSON.parse(readFileSync(exportJsonPath, 'utf8')) as CoreAnvilAddresses;
		const deployment = parseDeployment(payload);
		applyDeploymentEnv(deployment);
		return deployment;
	} finally {
		releaseLock();
	}
}

export async function deployCoreContracts(): Promise<CoreDeployment> {
	if (!deployPromise) {
		deployPromise = runCoreDeployment();
	}

	return deployPromise;
}

export async function deployAndInit(): Promise<Address> {
	const deployment = await deployCoreContracts();
	return deployment.intuition.multiVault;
}
