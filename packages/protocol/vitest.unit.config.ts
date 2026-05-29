import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.unit.test.ts'],
		environment: 'node',
		maxWorkers: 4,
		fileParallelism: true,
	},
});
