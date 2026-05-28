import 'dotenv/config';

import type { Server } from 'node:http';
import type { Socket } from 'node:net';

import { createPool, createProxy } from '@viem/anvil';

const ANVIL_PROXY_HOST = process.env.VITEST_ANVIL_PROXY_HOST ?? '127.0.0.1';
const ANVIL_PROXY_PORT = Number.parseInt(process.env.VITEST_ANVIL_PROXY_PORT ?? '8545', 10);

let server: Server | undefined;
let pool: ReturnType<typeof createPool> | undefined;
const sockets = new Set<Socket>();

export async function setup() {
	pool = createPool();
	server = await createProxy({
		pool,
		options: {
			// forkUrl: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
			// forkBlockNumber: 22782330,
			// You can specify the chain ID if you want to use a different one than the default
			chainId: 31337,
			codeSizeLimit: 32000,
		},
	});

	// Track open sockets so teardown can close them before shutting down the proxy.
	server.on('connection', (socket) => {
		sockets.add(socket);
		socket.on('close', () => sockets.delete(socket));
	});

	await new Promise<void>((resolve, reject) => {
		server!.once('error', reject);
		server!.listen(ANVIL_PROXY_PORT, ANVIL_PROXY_HOST, () => resolve());
	});

	server.unref();
}

export async function teardown() {
	if (!server || !pool) return;

	for (const socket of sockets) {
		socket.destroy();
	}
	sockets.clear();

	await new Promise<void>((resolve, reject) => {
		server!.close((error) => (error ? reject(error) : resolve()));
	});

	await pool.empty();
}
