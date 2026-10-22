import { describe, expect, it } from 'vitest';
import { createMemoryCancellableCache } from '../src/cache';

describe('createMemoryCancellableCache', () => {
	it('supports TTL expiry, removal, and exact abort reasons', async () => {
		let now = 100;
		const cache = createMemoryCancellableCache<{ value: string }>({ now: () => now });

		await cache.set('key', { value: 'cached' }, 50);
		await expect(cache.get('key')).resolves.toEqual({ value: 'cached' });
		now = 150;
		await expect(cache.get('key')).resolves.toBeNull();

		await cache.set('key', { value: 'again' }, 50);
		await cache.remove('key');
		await expect(cache.get('key')).resolves.toBeNull();

		const controller = new AbortController();
		const reason = new Error('cache cancelled');
		controller.abort(reason);
		await expect(cache.get('key', { signal: controller.signal })).rejects.toBe(reason);
	});
});
