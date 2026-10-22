import { defineConfig } from 'vitest/config';

// Unit specs only.
export default defineConfig({
	test: {
		include: ['src/**/*.spec.ts'],
		environment: 'node',
	},
});
