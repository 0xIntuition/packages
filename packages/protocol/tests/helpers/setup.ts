import { fetchLogs } from '@viem/anvil';
import { afterAll, afterEach } from 'vitest';

import { pool } from './utils.js';

const ANVIL_PROXY_HOST = process.env.VITEST_ANVIL_PROXY_HOST ?? '127.0.0.1';
const ANVIL_PROXY_PORT = Number.parseInt(process.env.VITEST_ANVIL_PROXY_PORT ?? '8545', 10);
const ANVIL_RPC_URL = `http://${ANVIL_PROXY_HOST}:${ANVIL_PROXY_PORT}`;

afterAll(async () => {
	// If you are using a fork, you can reset your anvil instance to the initial fork block.
	// Use `createTestClient(...).reset()` here if you decide to keep fork state between tests.
});

afterEach(async (context) => {
	context.onTestFailed(async () => {
		// If a test fails, you can fetch and print the logs of your anvil instance.
		const logs = await fetchLogs(ANVIL_RPC_URL, pool);
		// Only print the 20 most recent log messages.
		console.log(...logs.slice(-20));
	});
});
