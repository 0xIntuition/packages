import { describe, expect, it } from 'bun:test';

import { createProcessingRuntime } from '../src';

const BASE_ENV = {
	ATOM_SERVICES_CACHE_PROVIDER: 'none',
	SPOTIFY_CLIENT_ID: 'client-a',
	SPOTIFY_CLIENT_SECRET: 'secret-a',
};
const REQUIRED_CLASSIFIER_SINK = () => undefined;

describe('processing runtime configuration fingerprint', () => {
	it('is stable for identical effective configuration', () => {
		const first = createProcessingRuntime({
			env: { ...BASE_ENV },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
		});
		const second = createProcessingRuntime({
			env: { ...BASE_ENV },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
		});

		expect(first.fingerprint).toBe(second.fingerprint);
	});

	it('changes when effective concurrency changes', () => {
		const baseline = createProcessingRuntime({
			env: BASE_ENV,
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
		});
		const changed = createProcessingRuntime({
			env: BASE_ENV,
			enrichment: { concurrency: 9 },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
		});

		expect(changed.fingerprint).not.toBe(baseline.fingerprint);
	});

	it('hashes secret presence but never secret values', () => {
		const first = createProcessingRuntime({
			env: BASE_ENV,
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
		});
		const second = createProcessingRuntime({
			env: {
				...BASE_ENV,
				SPOTIFY_CLIENT_ID: 'client-b',
				SPOTIFY_CLIENT_SECRET: 'secret-b',
			},
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
		});

		expect(second.fingerprint).toBe(first.fingerprint);
		expect(second.fingerprint).not.toContain('secret-b');
	});
});
