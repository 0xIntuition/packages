import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@0xintuition/sdk/actions': fileURLToPath(
				new URL('../sdk/src/actions/index.ts', import.meta.url)
			),
			'@0xintuition/periphery': fileURLToPath(
				new URL('../periphery/src/index.ts', import.meta.url)
			),
			'@0xintuition/protocol': fileURLToPath(new URL('../protocol/src/index.ts', import.meta.url)),
			'@0xintuition/sdk': fileURLToPath(new URL('../sdk/src/index.ts', import.meta.url)),
		},
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
	},
});
