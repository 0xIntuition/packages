import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		// Timeouts are hang detectors, not performance budgets: CI runners are
		// 2-5x slower than dev machines, so the 5s default fails correct tests
		// on hardware variance. Slow tests surface as report warnings instead.
		testTimeout: 30_000,
		slowTestThreshold: 5_000,
	},
});
