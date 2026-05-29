import { availableParallelism } from 'node:os';

import { defineConfig } from 'vitest/config';

const requestedWorkers = Number.parseInt(process.env.PROTOCOL_TEST_MAX_WORKERS ?? '', 10);
const maxWorkers =
	Number.isFinite(requestedWorkers) && requestedWorkers > 0
		? requestedWorkers
		: Math.max(1, Math.min(2, availableParallelism()));

export default defineConfig({
	test: {
		include: ['tests/integration/**/*.int.test.ts'],
		environment: 'node',
		globalSetup: ['tests/helpers/global-setup.ts'],
		setupFiles: ['tests/helpers/setup.ts'],
		maxWorkers,
		fileParallelism: maxWorkers > 1,
	},
});
